const {
    Collection,
    Message,
    Snowflake,
} = require('discord.js');
const Trigger = require('./Trigger');
const stringSimilarity = require('string-similarity');
const Database = require('./Database');

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

class ChatTriggeredFeature {

    /**
     * Cache for all chat triggered features by tableName
     * @type {{}}
     */
    static cache = {};

    /**
     * Possible trigger types
     * @type {String[]}
     */
    static triggerTypes = ['regex', 'include', 'match', 'phishing'];

    /**
     * table name
     * @type {String}
     */
    static tableName;

    /**
     * column names
     * @type {String[]}
     */
    static columns;

    /**
     * @type {Object}
     * @property {String} type
     * @property {String} content
     * @property {String} [flags]
     */
    trigger;

    /**
     * @type {boolean}
     */
    global;

    /**
     * @type {Snowflake}
     */
    gid;

    /**
     * @type {Snowflake[]}
     */
    channels = [];

    /**
     * @param {Number} id ID in the database
     * @param {Trigger} trigger
     */
    constructor(id, trigger) {
        this.id = id;
        this.trigger = new Trigger(trigger);
    }

    /**
     * save database
     * @param {Database} db
     */
    static init(db) {
        database = db;
    }

    static getCache() {
        let cache = this.cache[this.tableName];
        if (!cache) {
            cache = {
                /**
                 * channel specific features
                 * @type {Collection}
                 */
                channels: new Collection(),

                /**
                 * guild wide features
                 * @type {Collection}
                 */
                guilds: new Collection()
            };
            this.cache[this.tableName] = cache;
        }
        return cache;
    }

    static getChannelCache() {
        return this.getCache().channels;
    }

    static getGuildCache() {
        return this.getCache().guilds;
    }

    /**
     * matches - does this message match this item
     * @param   {Message} message
     * @returns {boolean}
     */
    matches(message) {
        switch (this.trigger.type) {
            case 'include':
                if (message.content.toLowerCase().includes(this.trigger.content.toLowerCase())) {
                    return true;
                }
                break;

            case 'match':
                if (message.content.toLowerCase() === this.trigger.content.toLowerCase()) {
                    return true;
                }
                break;

            case 'regex': {
                let regex = new RegExp(this.trigger.content, this.trigger.flags);
                if (regex.test(message.content)) {
                    return true;
                }
                break;
            }

            case 'phishing': {
                // Split domain and min similarity (e.g. discord.com(gg):0.5)
                let [domain, similarity] = String(this.trigger.content).split(':');
                similarity = parseFloat(similarity) || 0.5;
                domain = domain.toLowerCase();
                // Split domain into "main part", extension and alternative extensions
                let parts = domain.match(/^([^/]+)\.([^./(]+)(?:\(([^)]+)\))?$/);
                if(!parts || !parts[1] || !parts[2]) {
                    break;
                }
                const expectedDomain = parts[1];
                const expectedExtensions = parts[3] ? [parts[2], ...parts[3].toLowerCase().split(/,\s?/g)] : [parts[2]];
                // Check all domains contained in the Discord message (and split them into "main part" and extension)
                let regex = /https?:\/\/([^/]+)\.([^./]+)\b/ig,
                    matches;
                while ((matches = regex.exec(message.content)) !== null) {
                    if(!matches[1] || !matches[2]) {
                        continue;
                    }
                    const foundDomain = matches[1].toLowerCase(),
                        foundExtension = matches[2].toLowerCase();
                    const mainPartMatches = foundDomain === expectedDomain || foundDomain.endsWith(`.${expectedDomain}`);
                    // Domain is the actual domain or a subdomain of the actual domain -> no phishing
                    if(mainPartMatches && expectedExtensions.includes(foundExtension)){
                        continue;
                    }
                    // "main part" matches, but extension doesn't -> probably phishing
                    if(mainPartMatches && !expectedExtensions.includes(foundExtension)) {
                        return true;
                    }
                    // "main part" is very similar to main part of the actual domain -> probably phishing
                    if(stringSimilarity.compareTwoStrings(expectedDomain, foundDomain) >= similarity) {
                        return true;
                    }
                }
                break;
            }
        }

        return false;
    }

    /**
     * serialize this object
     * must return data in same order as the static columns array
     * @returns {(*|string)[]}
     */
    serialize() {
        throw 'Abstract method not overridden!';
    }

    /**
     * Save to db and cache
     * @async
     * @return {Promise<Number>} id in db
     */
    async save() {
        if (this.id) {
            let assignments = [],
                columns = this.constructor.columns,
                data = this.serialize();
            for (const column of columns) {
                assignments.push(`${database.escapeId(column)}=?`);
            }
            if (data.length !== columns.length) throw 'Unable to update, lengths differ!';
            data.push(this.id);
            await database.queryAll(`UPDATE ${database.escapeId(this.constructor.tableName)} SET ${assignments.join(', ')} WHERE id = ?`, data);
        }
        else {
            /** @property {Number} insertId*/
            const dbentry = await database.queryAll(`INSERT INTO ${database.escapeId(this.constructor.tableName)} (${database.escapeIdArray(this.constructor.columns).join(', ')}) VALUES (${',?'.repeat(this.constructor.columns.length).slice(1)})`,this.serialize());
            this.id = dbentry.insertId;
        }

        if (this.global) {
            if (!this.constructor.getGuildCache().has(this.gid)) return this.id;
            this.constructor.getGuildCache().get(this.gid).set(this.id, this);
        }
        else {
            for (const channel of this.channels) {
                if(!this.constructor.getChannelCache().has(channel)) continue;
                this.constructor.getChannelCache().get(channel).set(this.id, this);
            }
        }

        return this.id;
    }

    /**
     * remove from cache and db
     * @async
     * @returns {Promise<void>}
     */
    async remove() {
        await database.query(`DELETE FROM ${database.escapeId(this.constructor.tableName)} WHERE id = ?`,[this.id]);

        if (this.global) {
            if (this.constructor.getGuildCache().has(this.gid))
                this.constructor.getGuildCache().get(this.gid).delete(this.id);
        }
        else {
            const channelCache = this.constructor.getChannelCache();
            for (const channel of this.channels) {
                if(channelCache.has(channel)) {
                    channelCache.get(channel).delete(this.id);
                }
            }
        }
    }

    /**
     * create this object from data retrieved from the database
     * @param data
     * @returns {Promise<ChatTriggeredFeature>}
     */
    static fromData(data) {
        return new this(data.guildid, {
            trigger: JSON.parse(data.trigger),
            punishment: data.punishment,
            response: data.response,
            global: data.global === 1,
            channels: data.channels.split(','),
            priority: data.priority
        }, data.id);
    }

    /**
     * Get a single bad word / autoresponse
     * @param {String|Number} id
     * @returns {Promise<null|ChatTriggeredFeature>}
     */
    static async getByID(id) {
        const result = await database.query(`SELECT * FROM ${database.escapeId(this.tableName)} WHERE id = ?`, [id]);
        if (!result) return null;
        return this.fromData(result);
    }

    /**
     * get a trigger
     * @param {String} type trigger type
     * @param {String} value trigger value
     * @returns {{trigger: Trigger, success: boolean, message: string}}
     */
    static getTrigger(type, value) {
        if (!this.triggerTypes.includes(type)) return {success: false, message: 'Usage: <type> <trigger>'};
        if (!value) return  {success: false, message:'Empty triggers are not allowed'};

        let content = value, flags;
        if (type === 'regex') {
            /** @type {String[]}*/
            let parts = value.split(/(?<!\\)\//);
            if (parts.length < 2 || parts.shift()?.length) return {success: false, message:'Invalid regex trigger'};
            [content, flags] = parts;
            try {
                new RegExp(content, flags);
            } catch {
                return {success: false, message:'Invalid regex trigger'};
            }
        }

        return {success: true, trigger:new Trigger({type, content: content, flags: flags})};
    }

    /**
     * Get items for a channel
     * @async
     * @param {Snowflake} channelId
     * @param {Snowflake} guildId
     * @return {Collection<Number,ChatTriggeredFeature>}
     */
    static async get(channelId, guildId) {

        if (!this.getChannelCache().has(channelId)) {
            await this.refreshChannel(channelId);
        }

        if (!this.getGuildCache().has(guildId)) {
            await this.refreshGuild(guildId);
        }

        return this.getChannelCache().get(channelId).concat(this.getGuildCache().get(guildId)).sort((a, b) => a.id - b.id);
    }

    /**
     * Get all items for a guild
     * @async
     * @param {Snowflake} guildId
     * @return {Collection<Number,ChatTriggeredFeature>}
     */
    static async getAll(guildId) {
        const result = await database.queryAll(`SELECT * FROM ${database.escapeId(this.tableName)} WHERE guildid = ?`, [guildId]);

        const collection = new Collection();
        for (const res of result) {
            collection.set(res.id, this.fromData(res));
        }

        return collection.sort((a, b) => a.id - b.id);
    }

    /**
     * Reload cache for a guild
     * @async
     * @param {Snowflake} guildId
     */
    static async refreshGuild(guildId) {
        const result = await database.queryAll(`SELECT * FROM ${database.escapeId(this.tableName)} WHERE guildid = ? AND global = TRUE`, [guildId]);

        const newItems = new Collection();
        for (const res of result) {
            newItems.set(res.id, this.fromData(res));
        }
        this.getGuildCache().set(guildId, newItems);
        setTimeout(() => {
            this.getGuildCache().delete(guildId);
        },cacheDuration);
    }

    /**
     * Reload cache for a channel
     * @async
     * @param {Snowflake} channelId
     */
    static async refreshChannel(channelId) {
        const result = await database.queryAll(`SELECT * FROM ${database.escapeId(this.tableName)} WHERE channels LIKE ?`, [`%${channelId}%`]);

        const newItems = new Collection();
        for (const res of result) {
            newItems.set(res.id, this.fromData(res));
        }
        this.getChannelCache().set(channelId, newItems);
        setTimeout(() => {
            this.getChannelCache().delete(channelId);
        },cacheDuration);
    }

}

module.exports = ChatTriggeredFeature;
