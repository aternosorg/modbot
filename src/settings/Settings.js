import {Collection} from 'discord.js';
import database from '../bot/Database.js';

/**
 * Config cache time (ms)
 * @type {number}
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
     * @type {string}
     */
    static tableName;

    /**
     * @type {number}
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
     * @type {string}
     */
    id;

    /**
     * @type {number}
     */
    createdAt;

    /**
     * @param {string} id ID in the database
     */
    constructor(id) {
        this.id = id;
        this.createdAt = Date.now();
    }

    /**
     * @returns {Collection<string, Settings>}
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
     * @returns {string}
     */
    static get escapedTableName() {
        return database.escapeId(this.tableName);
    }

    /**
     * create an empty settings
     * @param {string} key
     * @returns {this}
     */
    static empty(key) {
        return new this(key);
    }

    /**
     * create a settings from a database result
     * @param {{id: string, config: string}} result
     * @returns {this}
     */
    static create(result) {
        return new this(result.id, JSON.parse(result.config));
    }

    /**
     * Save to db and cache
     * @async
     * @returns {Promise<void>}
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
     * Get these settings from the DB
     * @param {string} key
     * @returns {Promise}
     * @private
     */
    static async _select(key) {
        return database.query(`SELECT id, config FROM ${this.escapedTableName} WHERE id = ?`, key);
    }

    /**
     * Get these settings from the DB
     * @returns {Promise}
     * @private
     */
    async _select() {
        return this.constructor._select(this.id);
    }

    /**
     * Update this settings in the DB
     * @returns {Promise}
     * @private
     */
    async _update() {
        return database.query(
            `UPDATE ${this.constructor.escapedTableName} SET config = ? WHERE id = ?`, this.toJSONString(), this.id);
    }

    /**
     * Insert a settings into the DB
     * @returns {Promise}
     * @protected
     */
    async insert() {
        return database.query(
            `INSERT INTO ${this.constructor.escapedTableName} (config,id) VALUES (?,?)`, this.toJSONString(), this.id);
    }

    /**
     * Get settings
     * @param {string} id
     * @returns {Promise<this>}
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
     * @returns {string}
     */
    toJSONString() {
        return JSON.stringify(this.getDataObject());
    }

    /**
     * get a clean data object
     * @param {this} [original]
     * @returns {this}
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
