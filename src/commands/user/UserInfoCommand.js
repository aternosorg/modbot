import Command from '../Command.js';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, PermissionsBitField, time, TimestampStyles} from 'discord.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import UserWrapper from '../../discord/UserWrapper.js';
import colors from '../../util/colors.js';
import UserEmbed from '../../embeds/UserEmbed.js';

export default class UserInfoCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ViewAuditLog);
    }

    buildOptions(builder) {
        builder.addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to view')
                .setRequired(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const user = await interaction.options.getUser('user', true);
        const message = await this.generateUserMessage(user, interaction);
        message.ephemeral = true;

        await interaction.reply(message);
    }

    supportsUserCommands() {
        return true;
    }

    async executeUserMenu(interaction) {
        const message = await this.generateUserMessage(interaction.targetUser, interaction);
        message.ephemeral = true;

        await interaction.reply(message);
    }

    async executeButton(interaction) {
        const match = await interaction.customId.match(/^[^:]+:refresh:(\d+)$/);
        if (!match) {
            await interaction.reply({ephemeral: true, content:'Unknown action!'});
            return;
        }

        const user = await (new UserWrapper(match[1])).fetchUser();
        if (!user) {
            await interaction.reply({ephemeral: true, content:'Unknown user!'});
            return;
        }
        await interaction.update(await this.generateUserMessage(user, interaction));
    }

    /**
     * generate user message with embed and buttons
     * @param {import('discord.js').User} user
     * @param {import('discord.js').Interaction} interaction
     * @return {Promise<{embeds: EmbedBuilder[], components: ActionRowBuilder[]}>}
     */
    async generateUserMessage(user, interaction) {
        const memberWrapper = new MemberWrapper(user, new GuildWrapper(interaction.guild));
        const member = await memberWrapper.fetchMember();
        const embed = new UserEmbed(user)
            .setColor(colors.GREEN)
            .addLine('Discord ID', user.id)
            .addLine('Created', time(user.createdAt, TimestampStyles.LongDate));

        /** @type {ActionRowBuilder<ButtonBuilder>} */
        const actionRow = new ActionRowBuilder()
            .addComponents(
                /** @type {*} */ new ButtonBuilder()
                    .setLabel('Strike')
                    .setCustomId(`strike:${user.id}`)
                    .setStyle(ButtonStyle.Danger),
            );
        const informationRow = new ActionRowBuilder()
            .addComponents(
                /** @type {*} */ new ButtonBuilder()
                    .setLabel('Refresh')
                    .setCustomId(`user:refresh:${user.id}`)
                    .setStyle(ButtonStyle.Secondary),
                /** @type {*} */ new ButtonBuilder()
                    .setLabel('Avatar')
                    .setCustomId(`avatar:${user.id}`)
                    .setStyle(ButtonStyle.Secondary),
                /** @type {*} */ new ButtonBuilder()
                    .setLabel('Moderations')
                    .setCustomId(`moderations:${user.id}`)
                    .setStyle(ButtonStyle.Secondary),
            );

        if (member) {
            embed.addLine('Joined', time(member.joinedAt, TimestampStyles.LongDate));
            actionRow.addComponents(
                /** @type {*} */ new ButtonBuilder()
                    .setLabel('Kick')
                    .setCustomId(`kick:${user.id}`)
                    .setStyle(ButtonStyle.Danger)
            );
        }

        {
            const strikeCount = await memberWrapper.getStrikeSum();
            embed.addLine('Moderations', (await memberWrapper.getModerations()).length)
                .addLine('Strike count', strikeCount);
            if (strikeCount) {
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Pardon')
                        .setCustomId(`pardon:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                );
            }
        }

        {
            const mute = await memberWrapper.getMuteInfo();
            if (mute.muted) {
                embed.newLine()
                    .addLine('Muted', mute.reason);
                if (mute.end) {
                    embed.addLine('Muted until', time(Math.floor(mute.end / 1_000)));
                }
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Unmute')
                        .setCustomId(`unmute:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                );
                embed.setColor(colors.ORANGE);
            }
            else {
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Mute')
                        .setCustomId(`mute:${user.id}`)
                        .setStyle(ButtonStyle.Danger)
                );
            }
        }

        {
            const ban = await memberWrapper.getBanInfo();
            if (ban.banned) {
                embed.newLine()
                    .addLine('Banned', ban.reason);
                if (ban.end) {
                    embed.addLine('Banned until', time(Math.floor(ban.end / 1_000)));
                }
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Unban')
                        .setCustomId(`unban:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                );
                embed.setColor(colors.RED);
            }
            else {
                actionRow.addComponents(
                    /** @type {*} */ new ButtonBuilder()
                        .setLabel('Ban')
                        .setCustomId(`ban:${user.id}`)
                        .setStyle(ButtonStyle.Danger)
                );
            }
        }

        return {
            embeds: [embed],
            components: [actionRow, informationRow],
        };
    }

    getDescription() {
        return 'Show information about a user';
    }

    getName() {
        return 'user';
    }
}