const Discord = require('discord.js');

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
     * @type {module:"discord.js".Client}
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
     * @param {module:"discord.js".Snowflake} id ID in the database
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * save database
     * @param {Database} db
     * @param {module:"discord.js".Client} client
     */
    static init(db, client) {
        this.database = db;
        this.client = client;
    }

    static getCache() {
        let cache = this.cache[this.tableName];
        if (!cache) {
            /**
             * config cache
             * @type {module:"discord.js".Collection}
             */
            cache = new Discord.Collection();

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
     * Save to db and cache
     * @async
     * @return {Promise<>}
     */
    async save() {
        const result = await this._select();
        if(result){
            await this._update();
        }
        else {
            await this._insert()
            this.constructor.getCache().set(this.id, this);
        }
    }

    /**
     * Get this config from the DB
     * @return {Promise<void>}
     * @private
     */
    async _select() {
        return this.constructor.database.query(`SELECT id, config FROM ${this.constructor.getTableName()} WHERE id = ?`,[this.id]);
    }

    /**
     * Update this config in the DB
     * @return {Promise<void>}
     * @private
     */
    async _update() {
        return this.constructor.database.query(`UPDATE ${this.constructor.getTableName()} SET config = ? WHERE id = ?`,[this.toJSONString(),this.id]);
    }

    /**
     * Insert a config into the DB
     * @return {Promise<void>}
     * @private
     */
    async _insert() {
        return this.constructor.database.query(`INSERT INTO ${this.constructor.getTableName()} (config,id) VALUES (?,?)`,[this.toJSONString(), this.id]);
    }

    /**
     * Get config
     * @async
     * @param {module:"discord.js".Snowflake|Snowflake} id
     * @return {Config}
     */
    static async get(id) {

        if (!this.getCache().has(id)) {
            let result = await this.database.query(`SELECT id, config FROM ${this.getTableName()} WHERE id = ?`, [id]);
            if(!result) return new this(id);
            this.getCache().set(result.id, new this(result.id, JSON.parse(result.config)));
            setTimeout(() => {
                this.getCache().delete(result.id);
            },cacheDuration);
        }

        return this.getCache().get(id);
    }

    /**
     * convert to JSON string
     * @return {string}
     */
    toJSONString() {
        return JSON.stringify(this);
    }
}

module.exports = Config;
