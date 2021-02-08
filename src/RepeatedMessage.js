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
     * @type {String}
     */
    #content;

    /**
     * @type {Timeout}
     */
    #timeout;

    /**
     * @type {Number}
     */
    #count = 1;

    /**
     * @param {module:"discord.js".Message} message
     */
    constructor(message) {
        this.#key = this.constructor.getKey(message);
        this.#messages.push(message);
        this.#content = message.content;
        this.#timeout = setTimeout(() => {
            this.constructor.#members.delete(this.#key);
        }, 30000);
    }

    /**
     * Is this message similar enough?
     * @param {module:"discord.js".Message} message
     * @return {boolean}
     */
    similarEnough(message) {
        const similarity = stringSimilarity.compareTwoStrings(message.content, this.#content);
        return similarity > 0.75;
    }

    /**
     * get count of repeated messages
     * @return {number}
     */
    getCount() {
        return this.#count;
    }

    /**
     * add a message
     * @param {module:"discord.js".Message} message
     */
    add(message) {
        this.#messages.push(message);
        this.#count++;
    }

    /**
     * cancel the cache deletion
     * only call this when you remove this item from the cache
     */
    cancelTimeout() {
        clearTimeout(this.#timeout);
    }

    /**
     * @return {Promise<void>}
     */
    async delete() {
        const reason = `Repeated ${this.#messages.length} times`;
        for (const message of this.#messages) {
            if (message.deletable) {
                await util.delete(message, {reason});
                await Log.logMessageDeletion(message, reason)
            }
        }
        this.#messages = [];
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
        if (cache.similarEnough(message)) {
            cache.add(message)
            return cache.getCount() >= 3;
        } else {
            cache.cancelTimeout();
            this.#members.set(key, new RepeatedMessage(message));
            return false;
        }
    }
}

module.exports = RepeatedMessage;
