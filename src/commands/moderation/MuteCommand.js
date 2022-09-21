import Command from '../Command.js';
import {
    ActionRowBuilder,
    EmbedBuilder,
    escapeMarkdown,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField, TextInputBuilder, TextInputStyle
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import {formatTime, parseTime} from '../../util/timeutils.js';
import colors from '../../util/colors.js';
import {TIMEOUT_DURATION_LIMIT} from '../../util/apiLimits.js';
import GuildWrapper from '../../discord/GuildWrapper.js';

export default class MuteCommand extends Command {


    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to mute')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Mute reason')
                .setRequired(false)
        );
        builder.addStringOption(option =>
            option.setName('duration')
                .setDescription('Mute duration')
                .setRequired(false)
        );
        return super.buildOptions(builder);
    }

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ModerateMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ModerateMembers);
    }

    supportsUserCommands() {
        return true;
    }

    async execute(interaction) {
        await this.mute(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
            interaction.user,
            parseTime(interaction.options.getString('duration')),
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @param {?string} reason
     * @param {import('discord.js').User} moderator
     * @param {?number} duration
     * @return {Promise<void>}
     */
    async mute(interaction, member, reason, moderator, duration) {
        reason = reason || 'No reason provided';

        if (!await member.isModerateable()) {
            await interaction.reply({ephemeral: true, content: 'I can\'t moderate this member!'});
            return;
        }

        const guildSettings = await member.getGuildSettings();
        if (!duration || duration > TIMEOUT_DURATION_LIMIT) {
            if (!guildSettings.mutedRole) {
                await interaction.reply({
                    ephemeral: true,
                    content: `Timeouts longer than ${formatTime(TIMEOUT_DURATION_LIMIT)} require a muted role! Use /muted-role to configure it.`
                });
                return;
            }


            const role = await (await GuildWrapper.fetch(interaction.guild.id)).fetchRole(guildSettings.mutedRole);
            if (interaction.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
                await interaction.reply({
                    ephemeral: true,
                    content: 'I can\'t manage the muted role. Please move my highest role above it.'
                });
                return;
            }
        }

        await member.mute(reason, moderator, duration);
        await interaction.reply({
            ephemeral: true,
            embeds: [new EmbedBuilder()
                .setDescription(`${escapeMarkdown(member.user.tag)} has been muted${duration ? ` for ${formatTime(duration)}` : ''}: ${reason}`)
                .setColor(colors.RED)
            ]}
        );
    }

    async executeButton(interaction) {
        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    async executeUserMenu(interaction) {
        const member = new MemberWrapper(interaction.targetUser, interaction.guild);
        await this.promptForData(interaction, member);
    }

    /**
     * prompt user for mute reason and duration
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Mute ${member.user.tag}`)
            .setCustomId(`mute:${member.user.id}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Reason')
                        .setCustomId('reason')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('No reason provided')),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Duration')
                        .setCustomId('duration')
                        .setStyle(TextInputStyle.Short)),
            ));
    }

    async executeModal(interaction) {
        let reason, duration;
        for (const row of interaction.components) {
            for (const component of row.components) {
                if (component.customId === 'reason') {
                    reason = component.value || 'No reason provided';
                }
                else if (component.customId === 'duration') {
                    duration = parseTime(component.value);
                }
            }
        }

        await this.mute(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason, interaction.user,
            duration
        );
    }

    getDescription() {
        return 'Mute a user';
    }

    getName() {
        return 'mute';
    }
}