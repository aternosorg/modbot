import {ActionRowBuilder, EmbedBuilder, escapeMarkdown, ModalBuilder, PermissionFlagsBits, PermissionsBitField, TextInputBuilder, TextInputStyle} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import ModerationCommand from './ModerationCommand.js';
import {decode64, encode64} from '../../util/base64.js';

export default class KickCommand extends ModerationCommand {

    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to kick')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Kick reason')
                .setRequired(false)
        );
        return super.buildOptions(builder);
    }

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.KickMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.KickMembers);
    }

    supportsUserCommands() {
        return true;
    }

    async execute(interaction) {
        await this.kick(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @return {Promise<void>}
     */
    async kick(interaction, member, reason) {
        reason = reason || 'No reason provided';

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, [encode64(reason)])) {
            return;
        }

        await member.kick(reason, interaction.user);
        await interaction.reply({
            ephemeral: true,
            embeds: [new EmbedBuilder()
                .setDescription(`${escapeMarkdown(member.user.tag)} has been kicked: ${reason}`)
                .setColor(colors.ORANGE)
            ]}
        );
    }

    async executeButton(interaction) {
        if (interaction.customId.endsWith(':confirm')) {
            const data = interaction.customId.split(':');
            await this.kick(
                interaction,
                await MemberWrapper.getMemberFromCustomId(interaction, 1),
                decode64(data[2]),
            );
            return;
        }

        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    async executeUserMenu(interaction) {
        const member = new MemberWrapper(interaction.targetUser, interaction.guild);
        await this.promptForData(interaction, member);
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Kick ${member.user.tag}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`kick:${member.user.id}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Reason')
                        .setCustomId('reason')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('No reason provided')),
            ));
    }

    async executeModal(interaction) {
        const reason = interaction.components[0].components.find(component => component.customId === 'reason').value
            || 'No reason provided';

        await this.kick(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason);
    }

    getDescription() {
        return 'Kick a user';
    }

    getName() {
        return 'kick';
    }
}