import {StringSelectMenuBuilder} from 'discord.js';
import {SELECT_MENU_OPTIONS_LIMIT} from './apiLimits.js';

/**
 * @param {import('../discord/ChannelWrapper.js')[]} channels
 * @param {import('discord.js').Snowflake[]} defaultChannels
 * @returns {import('discord.js').StringSelectMenuBuilder}
 */
export function channelSelectMenu(channels, defaultChannels = []) {
    return new StringSelectMenuBuilder()
        .setOptions(
            /** @type {*} */
            channels
                .sort((a,b) => {
                    const aParent = a.channel.parentId ?? '';
                    const bParent = b.channel.parentId ?? '';
                    return aParent.localeCompare(bParent) || a.channel.position - b.channel.position;
                })
                .map(channel => ({
                    default: defaultChannels.includes(channel.channel.id),
                    label: channel.channel.name,
                    value: channel.channel.id,
                    emoji: channel.getChannelEmoji(),
                }))
                .slice(0, SELECT_MENU_OPTIONS_LIMIT)
        )
        .setMinValues(1)
        .setMaxValues(Math.min(SELECT_MENU_OPTIONS_LIMIT, channels.length));
}