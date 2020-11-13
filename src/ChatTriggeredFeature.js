const Discord = require('discord.js');

/**
 * Database
 * @type {Database}
 */
let database;

/**
 * Config cache time (ms)
 * @type {Number}
 */
const cacheDuration = 10*60*1000;

/**
 * channel specific features
 * @type {module:"discord.js".Collection}
 */
const channels = new Discord.Collection();

/**
 * guild wide features
 * @type {module:"discord.js".Collection}
 */
const guilds = new Discord.Collection();

class ChatTriggeredFeature {

    static triggerTypes = ['regex', 'include', 'match'];

    static tableName;

    static columns;

    /**
     * @param {Number} id ID in the database
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * save database
     * @param {Database} db
     */
    static init(db) {
        database = db;
    }

    /**
     * matches - does this message match this item
     * @param   {module:"discord.js".Message} message
     * @returns {boolean}
     */
    matches(message) {
        switch (this.trigger.type) {
            case "include":
                if (message.content.toLowerCase().includes(this.trigger.content.toLowerCase())) {
                    return true;
                }
                break;

            case "match":
                if (message.content.toLowerCase() === this.trigger.content.toLowerCase()) {
                    return true;
                }
                break;

            case "regex":
                let regex = new RegExp(this.trigger.content,this.trigger.flags);
                if (regex.test(message.content)) {
                    return true;
                }
                break;
        }

        return false;
    }

    /**
     * Save to db and cache
     * @async
     * @return {Promise<Number>} id in db
     */
    async save() {
        if (!this.channels) this.channels = null;

        let dbentry = await database.queryAll(`INSERT INTO ${this.constructor.tableName} (${this.constructor.columns.join(', ')}) VALUES (${',?'.repeat(this.constructor.columns.length).slice(1)})`,this.serialize());

        this.id = dbentry.insertId;

        if (this.global) {
            if (!guilds.has(this.gid)) guilds.set(this.gid, new Discord.Collection())
            guilds.get(this.gid).set(this.id, this);
        }
        else {
            for (const channel of this.channels) {
                if(!channels.has(channel)) channels.set(channel, new Discord.Collection());
                channels.get(channel).set(this.id, this);
            }
        }

        return dbentry.insertId;
    }

    /**
     * remove from cache and db
     * @async
     * @returns {Promise<void>}
     */
    async remove() {
        await database.query(`DELETE FROM ${this.constructor.tableName} WHERE id = ?`,[this.id]);

        if (this.global) {
            if (guilds.has(this.gid))
                guilds.get(this.gid).delete(this.id);
        }
        else {
            for (const channel of this.channels) {
                channels.get(channel).delete(this.id);
            }
        }
    }

    /**
     * Get items for a channel
     * @async
     * @param {module:"discord.js".Snowflake} channelId
     * @param {module:"discord.js".Snowflake} guildId
     * @return {module:"discord.js".Collection<Number,ChatTriggeredFeature>}
     */
    static async get(channelId, guildId) {

        if (!channels.has(channelId)) {
            await this.refreshChannel(channelId);
        }

        if (!guilds.has(guildId)) {
            await this.refreshGuild(guildId);
        }

        return channels.get(channelId).concat(guilds.get(guildId)).sort((a, b) => a.id - b.id);
    }

    /**
     * Get all items for a guild
     * @async
     * @param {module:"discord.js".Snowflake} guildId
     * @return {module:"discord.js".Collection<Number,ChatTriggeredFeature>}
     */
    static async getAll(guildId) {
        const result = await database.queryAll(`SELECT * FROM ${this.tableName} WHERE guildid = ?`, [guildId]);

        const collection = new Discord.Collection();
        for (const res of result) {
            collection.set(res.id, new this(res.guildid, {
                trigger: JSON.parse(res.trigger),
                punishment: res.punishment,
                response: res.response,
                global: res.global === 1,
                channels: res.channels.split(',')
            }, res.id));
        }

        return collection.sort((a, b) => a.id - b.id);
    }

    /**
     * Reload cache for a guild
     * @async
     * @param {module:"discord.js".Snowflake} guildId
     */
    static async refreshGuild(guildId) {
        const result = await database.queryAll(`SELECT * FROM ${this.tableName} WHERE guildid = ? AND global = TRUE`, [guildId]);

        const newItems = new Discord.Collection();
        for (const res of result) {
            const o = new this(res.guildid, {
                trigger: JSON.parse(res.trigger),
                punishment: res.punishment,
                response: res.response,
                global: true,
                channels: []
            }, res.id);
            newItems.set(res.id, o);
        }
        guilds.set(guildId, newItems);
        setTimeout(() => {
            guilds.delete(guildId);
        },cacheDuration);
    }

    /**
     * Reload cache for a channel
     * @async
     * @param {module:"discord.js".Snowflake} channelId
     */
    static async refreshChannel(channelId) {
        const result = await database.queryAll(`SELECT * FROM ${this.tableName} WHERE channels LIKE ?`, [`%${channelId}%`]);

        const newItems = new Discord.Collection();
        for (const res of result) {
            newItems.set(res.id, new this(res.guildid, {
                trigger: JSON.parse(res.trigger),
                response: res.response,
                punishment: res.punishment,
                global: false,
                channels: res.channels.split(',')
            }, res.id));
        }
        channels.set(channelId, newItems);
        setTimeout(() => {
            channels.delete(channelId);
        },cacheDuration);
    }

}

module.exports = ChatTriggeredFeature;
