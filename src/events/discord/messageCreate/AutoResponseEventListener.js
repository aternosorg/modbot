import MessageCreateEventListener from './MessageCreateEventListener.js';
import AutoResponse from '../../../database/AutoResponse.js';
import {RESTJSONErrorCodes, ThreadChannel} from 'discord.js';
import {MESSAGE_LENGTH_LIMIT} from '../../../util/apiLimits.js';
import logger from '../../../bot/Logger.js';

export default class AutoResponseEventListener extends MessageCreateEventListener {

    async execute(message) {
        if (!message.guild || message.author.bot) {
            return;
        }
        let channel = message.channel;

        if (channel instanceof ThreadChannel) {
            channel = (/** @type {import('discord.js').ThreadChannel} */ channel).parent;
        }

        /** @type {IterableIterator<AutoResponse>} */
        const responses = (await AutoResponse.get(channel.id, message.guild.id)).values();
        const triggered = Array.from(responses).filter(response => response.matches(message));

        if (triggered.length) {
            const response = triggered[Math.floor(Math.random() * triggered.length)];
            try {
                await message.reply({content: response.response.substring(0, MESSAGE_LENGTH_LIMIT)});
            } catch (e) {
                if (e.code === RESTJSONErrorCodes.MissingPermissions) {
                    const channel = /** @type {import('discord.js').GuildTextBasedChannel} */ message.channel;
                    await logger.warn(`Missing permissions to respond to message in channel ${channel?.name} (${message.channelId}) of guild ${message.guild?.name} (${message.guildId})`, e);
                    return;
                }
                throw e;
            }
        }
    }
}