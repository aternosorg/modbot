import Command from '../Command.js';
import {ActionRowBuilder, ButtonStyle, PermissionFlagsBits, PermissionsBitField, time, TimestampStyles} from 'discord.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import UserWrapper from '../../discord/UserWrapper.js';
import colors from '../../util/colors.js';
import UserEmbed from '../../embeds/UserEmbed.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import {componentEmojiIfExists, inlineEmojiIfExists} from '../../util/format.js';
import BetterButtonBuilder from '../../embeds/BetterButtonBuilder.js';

/**
 * @import {EmbedBuilder, ButtonBuilder} from 'discord.js';
 */

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
            await interaction.reply(ErrorEmbed.message('Unknown action!'));
            return;
        }

        const user = await (new UserWrapper(match[1])).fetchUser();
        if (!user) {
            await interaction.reply(ErrorEmbed.message('Unknown user!'));
            return;
        }
        await interaction.update(await this.generateUserMessage(user, interaction));
    }

    /**
     * generate user message with embed and buttons
     * @param {import('discord.js').User} user
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<{embeds: EmbedBuilder[], components: ActionRowBuilder[]}>}
     */
    async generateUserMessage(user, interaction) {
        const memberWrapper = new MemberWrapper(user, new GuildWrapper(interaction.guild));
        const member = await memberWrapper.fetchMember();
        const embed = new UserEmbed(member ?? user)
            .setColor(colors.GREEN)
            .addPair(inlineEmojiIfExists('userId') + 'Discord ID', user.id)
            .addPair(inlineEmojiIfExists('userCreated') + 'Created', time(user.createdAt, TimestampStyles.LongDate));

        /** @type {ActionRowBuilder<ButtonBuilder>} */
        const actionRow = new ActionRowBuilder()
            .addComponents(
                /** @type {*} */ new BetterButtonBuilder()
                    .setLabel('Strike')
                    .setCustomId(`strike:${user.id}`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmojiIfPresent(componentEmojiIfExists('strike')),
            );
        const informationRow = new ActionRowBuilder()
            .addComponents(
                /** @type {*} */ new BetterButtonBuilder()
                    .setLabel('Refresh')
                    .setCustomId(`user:refresh:${user.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmojiIfPresent(componentEmojiIfExists('refresh')),
                /** @type {*} */ new BetterButtonBuilder()
                    .setLabel('Avatar')
                    .setCustomId(`avatar:${user.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmojiIfPresent(componentEmojiIfExists('avatar')),
                /** @type {*} */ new BetterButtonBuilder()
                    .setLabel('Moderations')
                    .setCustomId(`moderation:list:${user.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmojiIfPresent(componentEmojiIfExists('moderations')),
            );

        if (member) {
            embed.addPair(inlineEmojiIfExists('userJoined') + 'Joined', time(member.joinedAt, TimestampStyles.LongDate));
            actionRow.addComponents(
                /** @type {*} */ new BetterButtonBuilder()
                    .setLabel('Kick')
                    .setCustomId(`kick:${user.id}`)
                    .setStyle(ButtonStyle.Danger)
                    .setEmojiIfPresent(componentEmojiIfExists('kick'))
            );
        }

        {
            const strikeCount = await memberWrapper.getStrikeSum();
            embed.addPair(inlineEmojiIfExists('moderations') + 'Moderations', (await memberWrapper.getModerations()).length)
                .addPair(inlineEmojiIfExists('strike') + ' Strike count', strikeCount);
            if (strikeCount) {
                actionRow.addComponents(
                    /** @type {*} */ new BetterButtonBuilder()
                        .setLabel('Pardon')
                        .setCustomId(`pardon:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                        .setEmojiIfPresent(componentEmojiIfExists('pardon'))
                );
            }
        }

        {
            const mute = await memberWrapper.getMuteInfo();
            if (mute.muted) {
                embed.addPair( inlineEmojiIfExists('mute') + 'Muted', mute.reason);
                if (mute.end) {
                    embed.addPair(inlineEmojiIfExists('mute') + 'Muted until', time(Math.floor(mute.end / 1_000)));
                }
                embed.addPairIf(mute.comment, inlineEmojiIfExists('mute') + 'Mute comment', mute.comment);
                actionRow.addComponents(
                    /** @type {*} */ new BetterButtonBuilder()
                        .setLabel('Unmute')
                        .setCustomId(`unmute:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                        .setEmojiIfPresent(componentEmojiIfExists('mute'))
                );
                embed.setColor(colors.ORANGE);
            }
            else {
                actionRow.addComponents(
                    /** @type {*} */ new BetterButtonBuilder()
                        .setLabel('Mute')
                        .setCustomId(`mute:${user.id}`)
                        .setStyle(ButtonStyle.Danger)
                        .setEmojiIfPresent(componentEmojiIfExists('mute'))
                );
            }
        }

        {
            const ban = await memberWrapper.getBanInfo();
            if (ban.banned) {
                embed.addPair(inlineEmojiIfExists('ban') + 'Banned', ban.reason);
                if (ban.end) {
                    embed.addPair(inlineEmojiIfExists('ban') + 'Banned until', time(Math.floor(ban.end / 1_000)));
                }
                embed.addPairIf(ban.comment, inlineEmojiIfExists('ban') + 'Ban comment', ban.comment);
                actionRow.addComponents(
                    /** @type {*} */ new BetterButtonBuilder()
                        .setLabel('Unban')
                        .setCustomId(`unban:${user.id}`)
                        .setStyle(ButtonStyle.Success)
                        .setEmojiIfPresent(componentEmojiIfExists('ban'))
                );
                embed.setColor(colors.RED);
            }
            else {
                actionRow.addComponents(
                    /** @type {*} */ new BetterButtonBuilder()
                        .setLabel('Ban')
                        .setCustomId(`ban:${user.id}`)
                        .setStyle(ButtonStyle.Danger)
                        .setEmojiIfPresent(componentEmojiIfExists('ban'))
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