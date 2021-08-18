const {
    Collection,
    Snowflake,
    Message,
    TextBasedChannelFields
} = require('discord.js');
const stringSimilarity = require('string-similarity');
const Log = require('./Log');

class RepeatedMessage {

    /**
     * Repeated messages
     * key: {guildid}-{userid}
     * @type {Collection<Snowflake, RepeatedMessage>}
     */
    static #members = new Collection();

    /**
     * the key of this RepeatedMessage
     * {message.guild.id}-{message.author.id}
     * @type {String}
     */
    #key;

    /**
     * messages that haven't been deleted
     * @type {Message[]}
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
     * @param {Message} newMessage
     * @return {Message[]}
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
     * @param {Message} message
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
        return this.delete(this.#messages, 'Fast message spam');
    }

    /**
     * delete similar messages
     * @param {Message} message
     * @return {Promise<void>}
     */
    async deleteSimilar(message) {
        return this.delete(this.getSimilarMessages(message), 'Repeated messages');
    }

    /**
     * delete an array of messages if possible
     * @param {Message[]} messages
     * @param {String} reason
     * @returns {Promise<void>}
     */
    async delete(messages, reason) {
        messages = messages.filter(m => m.deletable);

        if (messages.length === 0) return;

        /** @type {TextBasedChannelFields} */
        const channel = messages[0].channel;
        await channel.bulkDelete(messages);

        await Promise.all(messages.map(m => Log.logMessageDeletion(m , reason)));
    }

    /**
     * get the key of this message
     * @param {Message} message
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
     * @param {Message} message
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
     * @param {Message} message
     * @param {Number}                      count   maximum allowed number of messages per minute
     */
    static async checkSpam(message, count) {
        const cache = this.#members.get(this.getKey(message));

        if (cache.getMessageCount() > count) {
            await cache.deleteAll();
            if (!cache.warned) {
                cache.warned = true;
                /** @type {Message} */
                const reply = await message.channel.send(`<@!${message.author.id}> Stop sending messages this fast!`);
                setTimeout(() => {
                    reply.delete().catch(console.error);
                }, 3000);
            }
        }
    }

    /**
     * remove this message if it is repeated
     * @param {Message} message
     * @param {Number}                      count   maximum allowed number of similar messages per minute
     */
    static async checkSimilar(message, count) {
        const cache = this.#members.get(this.getKey(message));
        const similar = cache.getSimilarMessageCount(message);
        if (similar > count) {
            await cache.deleteSimilar(message);
            if (!cache.warned) {
                cache.warned = true;
                /** @type {Message} */
                const reply = await message.channel.send(`<@!${message.author.id}> Stop repeating your messages!`);
                setTimeout(() => {
                    reply.delete().catch(console.error);
                }, 3000);
            }
        }
    }
}

module.exports = RepeatedMessage;
