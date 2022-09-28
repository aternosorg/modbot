import {SelectMenuBuilder} from 'discord.js';
import {SELECT_MENU_OPTIONS_LIMIT} from './apiLimits.js';

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