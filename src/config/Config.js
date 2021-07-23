const {Client, Snowflake, Collection} = require('discord.js');
const Database = require('../Database');

/**
 * Config cache time (ms)
 * @type {Number}
 */
const cacheDuration = 10*60*1000;

class Config {

    /**
     * Database
     * @type {Database}
     */
    static database;

    /**
     * Discord Client
     * @type {Client}
     */
    static client;

    /**
     * Cache for all configs by tableName
     * @type {{}}
     */
    static cache = {}

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
     * @param {Snowflake} id ID in the database
     */
    constructor(id) {
        this.id = id;
        this.createdAt = Date.now();
    }

    /**
     * save database
     * @param {Database} db
     * @param {Client} client
     */
    static init(db, client) {
        this.database = db;
        this.client = client;
    }

    /**
     * @return {Collection<String, Config>}
     */
    static getCache() {
        let cache = this.cache[this.tableName];
        if (!cache) {
            /**
             * config cache
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
    static getTableName() {
        return this.database.escapeId(this.tableName);
    }

    /**
     * create an empty config
     * @param {String} key
     * @return {Config}
     */
    static empty(key) {
        return new this(key);
    }

    /**
     * create a config from a database result
     * @param result
     * @return {Config}
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
            await this._insert();
            this.constructor.getCache().set(this.id, this);
        }
    }

    /**
     * Get this config from the DB
     * @return {Promise}
     * @private
     */
    static async _select(key) {
        return this.database.query(`SELECT id, config FROM ${this.getTableName()} WHERE id = ?`, [key]);
    }

    /**
     * Get this config from the DB
     * @return {Promise}
     * @private
     */
    async _select() {
        return this.constructor._select(this.id);
    }

    /**
     * Update this config in the DB
     * @return {Promise}
     * @private
     */
    async _update() {
        return this.constructor.database.query(`UPDATE ${this.constructor.getTableName()} SET config = ? WHERE id = ?`, [this.toJSONString(), this.id]);
    }

    /**
     * Insert a config into the DB
     * @return {Promise}
     * @private
     */
    async _insert() {
        return this.constructor.database.query(`INSERT INTO ${this.constructor.getTableName()} (config,id) VALUES (?,?)`, [this.toJSONString(), this.id]);
    }

    /**
     * Get config
     * @param {String} id
     * @return {Promise<Config>}
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
     * @param {Config} [original]
     * @return {Config}
     */
    getDataObject(original = this) {
        //copy to new object
        /** @type {Config} */
        const cleanObject = {};
        Object.assign(cleanObject,original);

        //delete createdAt attribute used for cache
        delete cleanObject.createdAt;

        return cleanObject;
    }
}

module.exports = Config;
