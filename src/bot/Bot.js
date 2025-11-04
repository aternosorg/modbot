import {
    Client,
    Partials,
    GatewayIntentBits,
    AllowedMentionsTypes,
    ActivityType,
    RESTJSONErrorCodes,
} from 'discord.js';
import {retry} from '../util/util.js';
import config from './Config.js';
import GuildWrapper from '../discord/GuildWrapper.js';
import MessageDeleteEmbed from '../formatting/embeds/MessageDeleteEmbed.js';

/**
 * @import {Message} from 'discord.js';
 */

export class Bot {
    /**
     * @type {import('discord.js').Client}
     */
    #client;

    #deletedMessages = new Set();

    constructor() {
        this.#client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
            ],
            allowedMentions: {
                parse: [
                    AllowedMentionsTypes.Role,
                    AllowedMentionsTypes.User
                ]
            },
            presence: { status: 'dnd', activities: [{ type: ActivityType.Custom, name: 'Watching you' }] },
            partials: [
                Partials.GuildMember,
                Partials.Channel,
            ],
        });
    }

    /**
     * @returns {import('discord.js').Client}
     */
    get client() {
        return this.#client;
    }

    get deletedMessages() {
        return this.#deletedMessages;
    }

    async start(){
        await this.#client.login(config.data.authToken);
    }

    /**
     * delete - deletes a message and ignores it in message logs
     * @param {import('discord.js').Message} message
     * @param {?string} reason if null don't send in message log
     * @param {?number} [timeout]
     * @returns {Promise<?Message>} deleted message
     */
    async delete(message, reason, timeout = null) {
        if (!message.deletable) {
            return null;
        }

        if (timeout) {
            setTimeout(() => {
                this.delete(message, reason).catch(console.error);
            }, timeout);
            return null;
        }

        // If the channel is not cached, discord.js refuses to delete the message and just throws an error
        // instead of fetching the channel. This method does not make an API call if the channel is already cached.
        await this.#client.channels.fetch(message.channelId);

        this.#deletedMessages.add(message.id);
        try {
            message = await retry(message.delete, message);
        } catch (e) {
            if (e.code !== RESTJSONErrorCodes.UnknownMessage) {
                throw e;
            }
        }

        if (reason) {
            await this.logMessageDeletion(message, reason);
        }
        return message;
    }

    /**
     * log that a message has been deleted
     * @param {import('discord.js').Message} message
     * @param {string} reason
     * @returns {Promise<void>}
     */
    async logMessageDeletion(message, reason) {
        const guild = new GuildWrapper(message.guild);
        const embed = new MessageDeleteEmbed(message);
        embed.addFields(
            // eslint-disable-next-line jsdoc/reject-any-type
            /** @type {any}*/ {name: 'Reason', value: reason.substring(0, 1024)},
        );

        await guild.logMessage(embed.toMessage());
    }
}

export default new Bot();
