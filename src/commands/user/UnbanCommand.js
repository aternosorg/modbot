import Command from '../Command.js';
import {ActionRowBuilder, EmbedBuilder, escapeMarkdown, ModalBuilder, PermissionFlagsBits, PermissionsBitField, TextInputBuilder, TextInputStyle} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';

export default class UnbanCommand extends Command {

    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to unban')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Unban reason')
                .setRequired(false)
        );
        return super.buildOptions(builder);
    }

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.BanMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.BanMembers);
    }

    async execute(interaction) {
        const member = new MemberWrapper(interaction.options.getUser('user', true), interaction.guild);
        const reason = interaction.options.getString('reason');
        await this.unban(interaction, member, reason, interaction.user);
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {import('discord.js').User} moderator
     * @return {Promise<void>}
     */
    async unban(interaction, member, reason, moderator) {
        if (!member) {
            return;
        }

        if (!await member.isBanned()) {
            await interaction.reply(ErrorEmbed.message('This member isn\'t banned!'));
            return;
        }

        reason = reason || 'No reason provided';
        await member.unban(reason, moderator);
        await interaction.reply({
            ephemeral: true,
            embeds: [new EmbedBuilder()
                .setDescription(`${escapeMarkdown(member.user.tag)} has been unbanned: ${reason}`)
                .setColor(colors.GREEN)
            ]}
        );
    }

    async executeButton(interaction) {
        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
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
            .setTitle(`Unban ${member.user.tag}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`unban:${member.user.id}`)
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

        await this.unban(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason, interaction.user);
    }

    getDescription() {
        return 'Unban a user';
    }

    getName() {
        return 'unban';
    }
}