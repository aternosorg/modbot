import {Collection, userMention} from 'discord.js';
import {compareTwoStrings} from 'string-similarity';
import bot from '../bot/Bot.js';

/**
 * @import {Message} from 'discord.js';
 */

export default class RepeatedMessage {

    /**
     * Repeated messages
     * key: {guildid}-{userid}
     * @type {Collection<string, RepeatedMessage>}
     */
    static #members = new Collection();

    /**
     * the key of this RepeatedMessage
     * {message.guild.id}-{message.author.id}
     * @type {string}
     */
    #key;

    /**
     * messages that haven't been deleted
     * @type {import('discord.js').Message[]}
     */
    #messages = [];

    /**
     * has this user been warned not to spam before
     */
    warned = false;

    /**
     * @param {Message} message
     */
    constructor(message) {
        this.#key = this.constructor.getKey(message);
        this.add(message);
    }

    /**
     * Are these messages similar enough?
     * @param {Message} messageA
     * @param {Message} messageB
     * @returns {boolean}
     */
    similarEnough(messageA, messageB) {
        const similarity = compareTwoStrings(messageA.content, messageB.content);
        return similarity > 0.85;
    }

    /**
     * get count of similar messages
     * @param {Message} newMessage
     * @returns {number}
     */
    getSimilarMessageCount(newMessage) {
        return this.getSimilarMessages(newMessage).length;
    }

    /**
     * get similar messages
     * @param {Message} newMessage
     * @returns {Message[]}
     */
    getSimilarMessages(newMessage) {
        let similarMessages = [];
        for (const cachedMessage of this.#messages) {
            if (this.similarEnough(newMessage, cachedMessage)) {
                similarMessages.push(cachedMessage);
            }
        }
        return similarMessages;
    }

    /**
     *  how many messages are cached for this member?
     *  @returns {number}
     */
    getMessageCount() {
        return this.#messages.length;
    }

    /**
     * add a message
     * @param {import('discord.js')} message
     */
    add(message) {
        this.#messages.push(message);
        setTimeout(() => {
            this.#messages.shift();
            if (this.#messages.length === 0) {
                this.constructor.#members.delete(this.#key);
            }
        }, 60000);
    }

    /**
     * @returns {Promise<void>}
     */
    async deleteAll() {
        return this.delete(this.#messages, 'Fast message spam');
    }

    /**
     * delete similar messages
     * @param {Message} message
     * @returns {Promise<void>}
     */
    async deleteSimilar(message) {
        return this.delete(this.getSimilarMessages(message), 'Repeated messages');
    }

    /**
     * delete an array of messages if possible
     * @param {import('discord.js').Message[]} messages
     * @param {string} reason
     * @returns {Promise<void>}
     */
    async delete(messages, reason) {
        messages = messages.filter(m => m.deletable);

        if (messages.length === 0) return;

        const channel = /** @type {import('discord.js').TextChannel} */ messages[0].channel;
        await channel.bulkDelete(messages);

        await Promise.all(messages.map(m => bot.logMessageDeletion(m, reason)));
    }

    /**
     * get the key of this message
     * @param {Message} message
     * @returns {string}
     */
    static getKey(message) {
        return `${message.guild.id}-${message.author.id}`;
    }

    /**
     * add this message to the correct cache
     * @param {import('discord.js').Message} message
     */
    static add(message) {
        const key = this.getKey(message);
        if (!this.#members.has(key)) {
            this.#members.set(key, new RepeatedMessage(message));
            return;
        }

        /** @type {RepeatedMessage} */
        const cache = this.#members.get(key);
        cache.add(message);
    }

    /**
     * remove this message if it is fast message spam
     * @param {import('discord.js').Message} message
     * @param {number} count maximum allowed number of messages per minute
     * @param {number} timeout reply timeout in ms
     * @returns {Promise<boolean>} was this message deleted
     */
    static async checkSpam(message, count, timeout) {
        const cache = this.#members.get(this.getKey(message));

        if (cache.getMessageCount() > count) {
            await cache.deleteAll();
            if (!cache.warned) {
                cache.warned = true;
                const reply = await message.channel.send(`${userMention(message.author.id)} Stop sending messages this fast!`);
                await bot.delete(reply, null, timeout);
            }
            return true;
        }
        return false;
    }

    /**
     * remove this message if it is repeated
     * @param {import('discord.js').Message} message
     * @param {number} count maximum allowed number of similar messages per minute
     * @param {number} timeout reply timeout in ms
     * @returns {Promise<boolean>} was this message deleted
     */
    static async checkSimilar(message, count, timeout) {
        const cache = this.#members.get(this.getKey(message));
        const similar = cache.getSimilarMessageCount(message);
        if (similar > count) {
            await cache.deleteSimilar(message);
            if (!cache.warned) {
                cache.warned = true;
                const reply = await message.channel.send(`${userMention(message.author.id)} Stop repeating your messages!`);
                await bot.delete(reply, null, timeout);
            }
            return true;
        }
        return false;
    }
}
