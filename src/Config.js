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
     */
    static init(db) {
        this.database = db;
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
     * Save to db and cache
     * @async
     * @return {Promise<>}
     */
    async save() {
        const json = this.toJSONString();
        const escapedTable = this.constructor.database.escapeId(this.constructor.tableName);

        const result = await this.constructor._select(json, escapedTable);
        if(result){
            await this.constructor._update(json, escapedTable);
        }
        else {
            await this.constructor._insert(json, escapedTable)
            this.constructor.getCache().set(this.id, this);
        }
    }

    /**
     * Get a config from the DB
     * @param {String}  json
     * @param {String}  escapedTable
     * @return {Promise<void>}
     * @private
     */
    static async _select(json, escapedTable) {
        return this.database.query(`SELECT * FROM ${escapedTable} WHERE id = ?`,[this.id]);
    }

    /**
     * Update a config in the DB
     * @param {String}  json
     * @param {String}  escapedTable
     * @return {Promise<void>}
     * @private
     */
    static async _update(json, escapedTable) {
        return this.database.query(`UPDATE ${escapedTable} SET config = ? WHERE id = ?`,[json,this.id]);
    }

    /**
     * Insert a config into the DB
     * @param {String}  json
     * @param {String}  escapedTable
     * @return {Promise<void>}
     * @private
     */
    static async _insert(json, escapedTable) {
        return this.database.query(`INSERT INTO ${escapedTable} (config,id) VALUES (?,?)`,[json,this.id]);
    }

    /**
     * Get config
     * @async
     * @param {module:"discord.js".Snowflake|Snowflake} id
     * @return {Config}
     */
    static async get(id) {

        if (!this.getCache().has(id)) {
            let result = await this.database.query(`SELECT * FROM ${this.database.escapeId(this.tableName)} WHERE id = ?`, id);
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
