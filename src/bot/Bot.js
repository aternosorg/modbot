import {
    Client,
    Partials,
    GatewayIntentBits,
    AllowedMentionsTypes,
    ActivityType,
    RESTJSONErrorCodes,
    EmbedBuilder,
    escapeMarkdown
} from 'discord.js';
import {retry} from '../util/util.js';
import config from './Config.js';
import colors from '../util/colors.js';
import GuildWrapper from '../discord/GuildWrapper.js';

export class Bot {
    /**
     * @type {Client}
     */
    #client;

    #deletedMessages = new Set();

    constructor() {
        this.#client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildBans,
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
            presence: { status: 'dnd', activities: [{ type: ActivityType.Watching, name: 'you' }] },
            partials: [
                Partials.GuildMember,
                Partials.Channel,
            ],
        });
    }

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

        this.#deletedMessages.add(message.id);
        try {
            message = await retry(message.delete, message);
        } catch (e) {
            if (e.code !== RESTJSONErrorCodes.UnknownMessage) {
                throw e;
            }
        }

        if (message.content && reason) {
            await this.logMessageDeletion(message, reason);
        }
        return message;
    }

    /**
     * log that a message has been deleted
     * @param {import('discord.js').Message} message
     * @param {string} reason
     * @return {Promise<void>}
     */
    async logMessageDeletion(message, reason) {
        const guild = new GuildWrapper(message.guild);
        await guild.logMessage({
            embeds: [new EmbedBuilder()
                .setTitle(`Message in <#${message.channel.id}> deleted`)
                .setFooter({text: message.author.id})
                .setAuthor({name: escapeMarkdown(message.author.tag), iconURL: message.author.avatarURL()})
                .setColor(colors.ORANGE)
                .setFields(
                    /** @type {any}*/ {name: 'Message', value: message.content.substring(0, 1024)},
                    /** @type {any}*/ {name: 'Reason', value: reason.substring(0, 1024)},
                )]
        });
    }
}

export default new Bot();
