import {Collection} from 'discord.js';
import Database from '../bot/Database.js';

/**
 * Config cache time (ms)
 * @type {Number}
 */
const cacheDuration = 10*60*1000;

/**
 * @classdesc a settings stored in the database (e.g. GuildSettings)
 */
export default class Settings {

    /**
     * Cache for all configs by tableName
     * @type {{}}
     */
    static cache = {};

    /**
     * table name
     * @type {String}
     */
    static tableName;

    /**
     * @type {NodeJS.Timer}
     */
    static clearCache = setInterval(() => {
        const cache = this.getCache();
        for (const [key, value] of cache.entries()) {
            if (value.createdAt + cacheDuration < Date.now()) {
                cache.delete(key);
            }
        }
    }, 60 * 1000);

    /**
     * @type {String}
     */
    id;

    /**
     * @type {Number}
     */
    createdAt;

    /**
     * @param {String} id ID in the database
     */
    constructor(id) {
        this.id = id;
        this.createdAt = Date.now();
    }

    /**
     * @return {Collection<String, Settings>}
     */
    static getCache() {
        let cache = this.cache[this.tableName];
        if (!cache) {
            /**
             * settings cache
             * @type {Collection}
             */
            cache = new Collection();

            this.cache[this.tableName] = cache;
        }
        return cache;
    }

    /**
     * get the escaped table name
     * @return {string}
     */
    static get escapedTableName() {
        return Database.instance.escapeId(this.tableName);
    }

    /**
     * create an empty settings
     * @param {String} key
     * @return {this}
     */
    static empty(key) {
        return new this(key);
    }

    /**
     * create a settings from a database result
     * @param result
     * @return {this}
     */
    static create(result) {
        return new this(result.id, JSON.parse(result.config));
    }

    /**
     * Save to db and cache
     * @async
     * @return {Promise<>}
     */
    async save() {
        const result = await this._select();
        if (result) {
            await this._update();
        } else {
            await this.insert();
            this.constructor.getCache().set(this.id, this);
        }
    }

    /**
     * Get this settings from the DB
     * @return {Promise}
     * @private
     */
    static async _select(key) {
        return Database.instance.query(`SELECT id, config FROM ${this.escapedTableName} WHERE id = ?`, key);
    }

    /**
     * Get this settings from the DB
     * @return {Promise}
     * @private
     */
    async _select() {
        return this.constructor._select(this.id);
    }

    /**
     * Update this settings in the DB
     * @return {Promise}
     * @private
     */
    async _update() {
        return this.constructor.database.query(
            `UPDATE ${this.constructor.escapedTableName} SET config = ? WHERE id = ?`, this.toJSONString(), this.id);
    }

    /**
     * Insert a settings into the DB
     * @return {Promise}
     * @protected
     */
    async insert() {
        return Database.instance.query(
            `INSERT INTO ${Database.instance.escapeId(this.constructor.escapedTableName)} (config,id) VALUES (?,?)`,
            this.toJSONString(), this.id);
    }

    /**
     * Get settings
     * @param {String} id
     * @return {Promise<this>}
     */
    static async get(id) {
        const cache = this.getCache();
        if (!cache.has(id)) {
            const result = await this._select(id);
            if (!result) return this.empty(id);

            cache.set(result.id, this.create(result));
        }

        return this.getCache().get(id);
    }

    /**
     * convert to JSON string
     * @return {string}
     */
    toJSONString() {
        return JSON.stringify(this.getDataObject());
    }

    /**
     * get a clean data object
     * @param {this} [original]
     * @return {this}
     */
    getDataObject(original = this) {
        //copy to new object
        const cleanObject = {};
        Object.assign(cleanObject,original);

        //delete createdAt attribute used for cache
        delete cleanObject.createdAt;

        return cleanObject;
    }
}
