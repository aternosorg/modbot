import {
    Client,
    Partials,
    GatewayIntentBits,
    AllowedMentionsTypes,
    ActivityType, RESTJSONErrorCodes, EmbedBuilder, escapeMarkdown
} from 'discord.js';
import {retry} from '../util/util.js';
import Config from './Config.js';
import colors from '../util/colors.js';
import GuildWrapper from '../discord/GuildWrapper.js';

export default class Bot {
    static #instance = null;

    /**
     * @type {Client}
     */
    #client;

    constructor() {
        this.#client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildBans,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages,
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

    static get instance() {
        return this.#instance ??= new Bot();
    }

    get client() {
        return this.#client;
    }

    async start(){
        await this.#client.login(Config.instance.data.authToken);
    }

    /**
     * delete - deletes a message and ignores it in message logs
     * @param {Message} message
     * @param {?string} reason if null don't send in message log
     * @param {?number} [timeout]
     * @returns {Promise<?Message>} deleted message
     */
    async delete(message, reason, timeout = null) {
        if (timeout) {
            setTimeout(() => {
                Bot.instance.delete(message, reason).catch(console.error);
            }, timeout);
            return null;
        }

        // TODO: ignore message deletion
        try {
            message = await retry(message.delete, message);
        } catch (e) {
            if (e.code !== RESTJSONErrorCodes.UnknownMessage) {
                throw e;
            }
        }

        const guild = new GuildWrapper(message.guild);

        if (message.content && reason) {
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
        return message;
    }
}
