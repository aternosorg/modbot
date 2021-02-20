const Discord = require('discord.js');
const stringSimilarity = require("string-similarity");
const Log = require('./Log');
const util = require('./util');

class RepeatedMessage {

    /**
     * Repeated messages
     * key: {guildid}-{userid}
     * @type {module:"discord.js".Collection<module:"discord.js".Snowflake, RepeatedMessage>}
     */
    static #members = new Discord.Collection();

    /**
     * the key of this RepeatedMessage
     * {message.guild.id}-{message.author.id}
     * @type {String}
     */
    #key;

    /**
     * messages that haven't been deleted
     * @type {module:"discord.js".Message[]}
     */
    #messages = [];

    /**
     * @param {module:"discord.js".Message} message
     */
    constructor(message) {
        this.#key = this.constructor.getKey(message);
        this.#messages.push(message);
    }

    /**
     * Are these messages similar enough?
     * @param {module:"discord.js".Message} messageA
     * @param {module:"discord.js".Message} messageB
     * @return {boolean}
     */
    similarEnough(messageA, messageB) {
        const similarity = stringSimilarity.compareTwoStrings(messageA.content, messageB.content);
        return similarity > 0.85;
    }

    /**
     * get count of similar messages
     * @return {number}
     */
    getSimilarMessageCount(newMessage) {
        return this.getSimilarMessages(newMessage).length;
    }

    /**
     * get similar messages
     * @param {module:"discord.js".Message} newMessage
     * @return {module:"discord.js".Message[]}
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
     *  @return {Number}
     */
    getMessageCount() {
        return this.#messages.length;
    }

    /**
     * add a message
     * @param {module:"discord.js".Message} message
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
     * @return {Promise<void>}
     */
    async deleteAll() {
        const reason = `Fast message spam`;
        for (const message of this.#messages) {
            if (message.deletable) {
                await util.delete(message, {reason});
                await Log.logMessageDeletion(message, reason)
            }
        }
    }

    /**
     * delete similar messages
     * @param {module:"discord.js".Message} message
     * @return {Promise<void>}
     */
    async deleteSimilar(message) {
        const reason = `Repeated messages`;
        for (const cacheMessage of this.getSimilarMessages(message)) {
            if (cacheMessage.deletable) {
                await util.delete(cacheMessage, {reason});
                await Log.logMessageDeletion(cacheMessage, reason)
            }
        }
    }

    /**
     * get the key of this message
     * @param {module:"discord.js".Message} message
     * @return {string}
     */
    static getKey(message) {
        return `${message.guild.id}-${message.author.id}`;
    }

    /**
     * @param key
     * @return {RepeatedMessage}
     */
    static get(key) {
        return this.#members.get(key);
    }

    /**
     * add this message to the correct cache
     * @param {module:"discord.js".Message} message
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
     * @param {module:"discord.js".Message} message
     * @param {Number}                      count   maximum allowed number of messages per minute
     */
    static async checkSpam(message, count) {
        const cache = this.#members.get(this.getKey(message));

        if (cache.getMessageCount() > count) {
            await cache.deleteAll();
            /** @type {module:"discord.js".Message} */
            const reply = await message.channel.send(`<@!${message.author.id}> Stop sending messages this fast!`);
            await reply.delete({timeout: 3000});
        }
    }

    /**
     * remove this message if it is repeated
     * @param {module:"discord.js".Message} message
     * @param {Number}                      count   maximum allowed number of similar messages per minute
     */
    static async checkSimilar(message, count) {
        const cache = this.#members.get(this.getKey(message));
        const similar = cache.getSimilarMessageCount(message);
        if (similar > count) {
            await cache.deleteSimilar(message);
            /** @type {module:"discord.js".Message} */
            const reply = await message.channel.send(`<@!${message.author.id}> Stop repeating your messages!`);
            await reply.delete({timeout: 3000});
        }
    }
}

module.exports = RepeatedMessage;
