import {ChannelType, PermissionFlagsBits, SelectMenuBuilder, TextChannel} from 'discord.js';
import {SELECT_MENU_OPTIONS_LIMIT} from './apiLimits.js';
import Config from '../bot/Config.js';

export const LOCK_PERMISSIONS = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AddReactions,
];

/**
 * can this channel be locked
 * @param {import('discord.js').GuildChannel} channel
 * @return {boolean}
 */
export function isLockable(channel) {
    if (!(channel instanceof TextChannel))
        return false;

    const everyonePermissions = channel.permissionsFor(channel.guild.roles.everyone);
    if (!everyonePermissions.has(PermissionFlagsBits.ViewChannel))
        return false;

    return LOCK_PERMISSIONS.some(permission => everyonePermissions.has(permission));
}

export async function isLocked() {

}

/**
 * @param {import('discord.js').GuildChannel[]} channels
 * @return {SelectMenuBuilder}
 */
export function channelSelectMenu(channels) {
    return new SelectMenuBuilder()
        .setMinValues(1)
        .setMaxValues(SELECT_MENU_OPTIONS_LIMIT)
        .setOptions(
            /** @type {*} */
            channels.map(channel => {
                return {
                    default: false,
                    label: channel.name,
                    value: channel.id
                };
            }).slice(0, SELECT_MENU_OPTIONS_LIMIT)
        )
        .setMinValues(1)
        .setMaxValues(Math.min(SELECT_MENU_OPTIONS_LIMIT, channels.length));
}

/**
 * @param {import('discord.js').ChannelType} type
 * @return {import('discord.js').Snowflake|null}
 */
export function getChannelEmojiId(type) {
    const emojis = Config.instance.data.emoji;

    switch (type) {
        case ChannelType.AnnouncementThread:
        case ChannelType.PublicThread:
        case ChannelType.PrivateThread:
            return emojis.Thread;

        case ChannelType.GuildAnnouncement:
            return emojis.Announcement;

        case ChannelType.GuildForum:
            return emojis.Forum;

        case ChannelType.GuildStageVoice:
            return emojis.Stage;

        case ChannelType.GuildVoice:
            return emojis.Voice;

        default:
            return emojis.Channel;
    }
}