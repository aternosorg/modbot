import Command from '../Command.js';
import {ActionRowBuilder, EmbedBuilder, escapeMarkdown, ModalBuilder, PermissionFlagsBits, PermissionsBitField, TextInputBuilder, TextInputStyle} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';

export default class KickCommand extends Command {

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
            interaction.user
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @param {?string} reason
     * @param {import('discord.js').User} moderator
     * @return {Promise<void>}
     */
    async kick(interaction, member, reason, moderator) {
        reason = reason || 'No reason provided';

        if (!await member.isModerateable()) {
            await interaction.reply({ephemeral: true, content: 'I can\'t moderate this member!'});
            return;
        }

        await member.kick(reason, moderator);
        await interaction.reply({
            ephemeral: true,
            embeds: [new EmbedBuilder()
                .setDescription(`${escapeMarkdown(member.user.tag)} has been kicked: ${reason}`)
                .setColor(colors.ORANGE)
            ]}
        );
    }

    async executeButton(interaction) {
        await this.promptAndKick(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    async executeUserMenu(interaction) {
        const member = new MemberWrapper(interaction.targetUser, interaction.guild);
        await this.promptAndKick(interaction, member);
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @return {Promise<void>}
     */
    async promptAndKick(interaction, member) {
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Kick ${member.user.tag}`)
            .setCustomId('kick')
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

        await this.kick(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason, interaction.user);
    }

    getDescription() {
        return 'Kick a user';
    }

    getName() {
        return 'kick';
    }
}