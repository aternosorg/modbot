import MessageCreateEventListener from './MessageCreateEventListener.js';
import AutoResponse from '../../../database/AutoResponse.js';
import {RESTJSONErrorCodes, ThreadChannel} from 'discord.js';
import {MESSAGE_LENGTH_LIMIT} from '../../../util/apiLimits.js';
import logger from '../../../bot/Logger.js';
import {asyncFilter} from '../../../util/util.js';
import cloudVision from '../../../apis/CloudVision.js';
import GuildSettings from '../../../settings/GuildSettings.js';

export default class AutoResponseEventListener extends MessageCreateEventListener {

    async execute(message) {
        if (!message.guild || message.author.bot) {
            return;
        }
        let channel = message.channel;

        if (channel instanceof ThreadChannel) {
            channel = (/** @type {import('discord.js').ThreadChannel} */ channel).parent;
        }

        let texts = null;
        const responses = /** @type {AutoResponse[]} */ Array.from((
            await AutoResponse.get(channel.id, message.guild.id)
        ).values());
        const triggered = /** @type {AutoResponse[]} */ await asyncFilter(responses,
            /**
             *  @param {AutoResponse} response
             *  @returns {Promise<boolean>}
             */
            async response => {
                if (response.matches(message.content)) {
                    return true;
                }

                if (!cloudVision.isEnabled
                    || !(await GuildSettings.get(message.guild.id)).isFeatureWhitelisted
                    || !response.enableVision
                    || !response.trigger.supportsImages()
                ) {
                    return false;
                }

                texts ??= await cloudVision.getImageText(message);
                return texts.some(t => response.matches(t));
            }
        );

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