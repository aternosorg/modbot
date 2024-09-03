import {Collection} from 'discord.js';
import database from '../bot/Database.js';
import LineEmbed from '../embeds/LineEmbed.js';
import {EMBED_DESCRIPTION_LIMIT} from '../util/apiLimits.js';
import colors from '../util/colors.js';
import Triggers from './triggers/Triggers.js';

/**
 * @import {Trigger} from './triggers/Trigger.js';
 */

/**
 * Config cache time (ms)
 * @type {number}
 */
const cacheDuration = 10 * 60 * 1000;

/**
 * @class
 * @classdesc a feature triggered by chat messages (auto responses and bad words)
 * @abstract
 */
export default class ChatTriggeredFeature {

    /**
     * Cache for all chat triggered features by tableName
     * @type {{}}
     */
    static cache = {};

    /**
     * Possible trigger types
     * @type {string[]}
     */
    static triggerTypes = ['regex', 'include', 'match', 'phishing'];

    /**
     * table name
     * @type {string}
     */
    static tableName;

    /**
     * column names
     * @type {string[]}
     */
    static columns;

    /**
     * @type {Trigger}
     */
    trigger;

    /**
     * @type {boolean}
     */
    global;

    /**
     * @type {import('discord.js').Snowflake}
     */
    gid;

    /**
     * @type {import('discord.js').Snowflake[]}
     */
    channels = [];

    /**
     * Whether cloud vision is enabled for this feature
     * @type {boolean}
     */
    enableVision = false;

    /**
     * @param {number} id ID in the database
     * @param {Trigger} trigger
     */
    constructor(id, trigger) {
        this.id = id;
        this.trigger = Triggers.of(trigger);
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
     * get the placeholder text for this trigger type
     * @param {string} type
     * @returns {string}
     */
    static getTriggerPlaceholder(type) {
        switch (type) {
            case 'regex':
                return '/regex/flags';

            case 'phishing':
                return 'domain.com(other,tlds):similarity';

            default:
                return 'trigger';
        }
    }

    /**
     * Does the trigger match this content
     * @param   {string} content
     * @returns {boolean}
     */
    matches(content) {
        return this.trigger.test(content);
    }

    /**
     * serialize this object
     * must return data in same order as the static columns array
     * @returns {(*|string)[]}
     * @abstract
     */
    serialize() {
        throw new Error('Abstract method not overridden!');
    }

    /**
     * get an overview of this object
     * @returns {string}
     * @abstract
     */
    getOverview() {
        throw new Error('Abstract method not overridden!');
    }

    /**
     * get escaped table name
     * @returns {string}
     */
    static get escapedTableName() {
        return database.escapeId(this.tableName);
    }

    /**
     * get an overview of all objects of this type for this guild
     * @param {import('discord.js').Guild} guild
     * @param {string} name feature name (e.g. Auto-responses or Bad-words).
     * @returns {Promise<LineEmbed[]>}
     */
    static async getGuildOverview(guild, name) {
        const objects = await this.getAll(guild.id);
        if (!objects || !objects.size) {
            return [new LineEmbed()
                .setAuthor({name: `${name} for ${guild.name}`, iconURL: guild.iconURL()})
                .setColor(colors.GREEN)
                .setDescription(`There are no ${name} on this server.`)
            ];
        }

        let embed = new LineEmbed();
        const embeds = [embed];
        for (const object of objects.values()) {
            const info = object.getOverview();

            if (embed.data.description?.length + info.length > EMBED_DESCRIPTION_LIMIT) {
                embed = new LineEmbed();
                embeds.push(embed);
            }
            embed.addLine(info);
        }

        for (const [page, embed] of embeds.entries()) {
            embed.setColor(colors.GREEN)
                .setAuthor({
                    name: `${name} for ${guild.name} | ${page + 1}/${embeds.length}`,
                    iconURL: guild.iconURL(),
                });
        }

        return embeds;
    }

    /**
     * Save to db and cache
     * @async
     * @returns {Promise<number>} id in db
     */
    async save() {
        if (this.id) {
            let assignments = [],
                columns = this.constructor.columns,
                data = this.serialize();
            for (const column of columns) {
                assignments.push(`${database.escapeId(column)}=?`);
            }
            if (data.length !== columns.length) throw new Error('Unable to update, lengths differ!');
            data.push(this.id);
            await database.queryAll(`UPDATE ${this.constructor.escapedTableName}
                                     SET ${assignments.join(', ')}
                                     WHERE id = ?`, ...data);
        } else {
            const columns = database.escapeId(this.constructor.columns);
            const values = ',?'.repeat(this.constructor.columns.length).slice(1);
            /** @property {number} insertId*/
            const dbEntry = await database.queryAll(
                `INSERT INTO ${this.constructor.escapedTableName} (${columns})
                 VALUES (${values})`, ...this.serialize());
            this.id = dbEntry.insertId;
        }

        if (this.global) {
            if (!this.constructor.getGuildCache().has(this.gid)) return this.id;
            this.constructor.getGuildCache().get(this.gid).set(this.id, this);
        } else {
            for (const channel of this.channels) {
                if (!this.constructor.getChannelCache().has(channel)) continue;
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
    async delete() {
        await database.query(`DELETE FROM ${this.constructor.escapedTableName} WHERE id = ?`, [this.id]);

        if (this.global) {
            if (this.constructor.getGuildCache().has(this.gid))
                this.constructor.getGuildCache().get(this.gid).delete(this.id);
        } else {
            const channelCache = this.constructor.getChannelCache();
            for (const channel of this.channels) {
                if (channelCache.has(channel)) {
                    channelCache.get(channel).delete(this.id);
                }
            }
        }
    }

    /**
     * create this object from data retrieved from the database
     * @param {object} data
     * @returns {this}
     */
    static fromData(data) {
        data.trigger = JSON.parse(data.trigger);
        data.global = data.global === 1;
        data.channels = data.channels.split(',');
        return new this(data.guildid, data, data.id);
    }

    /**
     * Get a single bad word / auto response
     * @param {string|number} id
     * @param {import('discord.js').Snowflake} guildid
     * @returns {Promise<?this>}
     */
    static async getByID(id, guildid) {
        const result = await database.query(`SELECT *
                                             FROM ${this.escapedTableName}
                                             WHERE id = ?
                                               AND guildid = ?`, id, guildid);
        if (!result) return null;
        return this.fromData(result);
    }

    /**
     * get a trigger
     * @param {string} type trigger type
     * @param {string} value trigger value
     * @returns {{trigger: ?Trigger, success: boolean, message: ?string}}
     */
    static getTrigger(type, value) {
        if (!this.triggerTypes.includes(type)) return {
            success: false,
            message: `Invalid trigger type ${type}`,
            trigger: null
        };
        if (!value) return {success: false, message: 'Empty triggers are not allowed', trigger: null};

        let content = value, flags;
        if (type === 'regex') {
            /** @type {string[]}*/
            let parts = value.split(/(?<!\\)\//);
            if (parts.length < 2 || parts.shift()?.length) return {
                success: false,
                message: 'Invalid regex trigger',
                trigger: null
            };
            [content, flags] = parts;
            try {
                new RegExp(content, flags);
            } catch {
                return {success: false, message: 'Invalid regex trigger', trigger: null};
            }
        }

        return {success: true, trigger: Triggers.of({type, content: content, flags: flags}), message: null};
    }

    /**
     * Get items for a channel
     * @async
     * @param {import('discord.js').Snowflake} channelId
     * @param {import('discord.js').Snowflake} guildId
     * @returns {Collection<number, this>}
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
     * @param {import('discord.js').Snowflake} guildId
     * @returns {Promise<Collection<number, this.prototype>>}
     */
    static async getAll(guildId) {
        const result = await database.queryAll(
            `SELECT *
             FROM ${this.escapedTableName}
             WHERE guildid = ?`, [guildId]);

        const collection = new Collection();
        for (const res of result) {
            collection.set(res.id, this.fromData(res));
        }

        return collection.sort((a, b) => a.id - b.id);
    }

    /**
     * Reload cache for a guild
     * @async
     * @param {import('discord.js').Snowflake} guildId
     */
    static async refreshGuild(guildId) {
        const result = await database.queryAll(
            `SELECT *
             FROM ${this.escapedTableName}
             WHERE guildid = ?
               AND global = TRUE`, [guildId]);

        const newItems = new Collection();
        for (const res of result) {
            newItems.set(res.id, this.fromData(res));
        }
        this.getGuildCache().set(guildId, newItems);
        setTimeout(() => {
            this.getGuildCache().delete(guildId);
        }, cacheDuration);
    }

    /**
     * Reload cache for a channel
     * @async
     * @param {import('discord.js').Snowflake} channelId
     */
    static async refreshChannel(channelId) {
        const result = await database.queryAll(
            `SELECT *
             FROM ${this.escapedTableName}
             WHERE channels LIKE ?`, [`%${channelId}%`]);

        const newItems = new Collection();
        for (const res of result) {
            newItems.set(res.id, this.fromData(res));
        }
        this.getChannelCache().set(channelId, newItems);
        setTimeout(() => {
            this.getChannelCache().delete(channelId);
        }, cacheDuration);
    }

}
