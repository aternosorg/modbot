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

class Config {

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
        database = db;
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
        let result = await database.query(`SELECT * FROM ${database.escapeId(this.constructor.tableName)} WHERE id = ?`,[this.id]);
        if(result){
            await database.query(`UPDATE ${database.escapeId(this.constructor.tableName)} SET config = ? WHERE id = ?`,[json,this.id]);
        }
        else {
            await database.query(`INSERT INTO ${database.escapeId(this.constructor.tableName)} (config,id) VALUES (?,?)`,[json,this.id]);
            this.constructor.getCache().set(this.id, this);
        }
    }

    /**
     * Get config
     * @async
     * @param {module:"discord.js".Snowflake|Snowflake} id
     * @return {Config}
     */
    static async get(id) {

        if (!this.getCache().has(id)) {
            let result = await database.query(`SELECT * FROM ${database.escapeId(this.tableName)} WHERE id = ?`, id);
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
