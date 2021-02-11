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
        return similarity > 0.75;
    }

    /**
     * get count of similar messages
     * @return {number}
     */
    getSimilarMessageCount(newMessage) {
        let similarMessages = 0;
        for (const cachedMessage of this.#messages) {
            if (this.similarEnough(newMessage, cachedMessage)) {
                similarMessages++;
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
        }, 30000);
    }

    /**
     * @return {Promise<void>}
     */
    async delete() {
        const reason = `Message spam`;
        for (const message of this.#messages) {
            if (message.deletable) {
                await util.delete(message, {reason});
                await Log.logMessageDeletion(message, reason)
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
     * should this message be deleted
     * @param {module:"discord.js".Message} message
     * @return {boolean}
     */
    static isSpam(message) {
        const key = this.getKey(message);
        if (!this.#members.has(key)) {
            this.#members.set(key, new RepeatedMessage(message));
            return false;
        }

        /** @type {RepeatedMessage} */
        const cache = this.#members.get(key);
        cache.add(message);
        const similar = cache.getSimilarMessageCount(message);

        return similar >= 3 || cache.getMessageCount() >= 5;
    }
}

module.exports = RepeatedMessage;
