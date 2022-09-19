import * as mysql from 'mysql2/promise';
import Logger from '../Logger.js';

export default class Database {
    static #instance = new Database();

    /**
     * @type {import("mysql2").Connection}
     */
    #connection = null;

    /**
     * @type {{resolve: function, reject: function}[]}
     */
    #waiting = [];

    /**
     * @return {Database}
     */
    static get instance() {
        return this.#instance;
    }

    /**
     * @param {DatabaseConfig} options
     * @returns {Promise<void>}
     */
    async connect(options) {
        this.options = options;
        this.options.charset = 'utf8mb4';
        this.options.supportBigNumbers = true;
        this.options.bigNumberStrings = true;
        await this.#connect();
    }

    /**
     * Wait until a working MySQL connection is available
     *
     * @returns {Promise<void>}
     */
    waitForConnection() {
        return new Promise((resolve, reject) => {
            if (this.#connection !== null) {
                return resolve();
            }
            this.#waiting.push({resolve, reject});
        });
    }

    /**
     * Connect to MySQL
     */
    async #connect() {
        try {
            this.#connection = await mysql.createConnection(this.options);

            this.#connection.on('error', this.#handleConnectionError.bind(this));

            for (let waiting of this.#waiting) {
                waiting.resolve();
            }
            this.#waiting = [];
        }
        catch (error) {
            return this.#handleFatalError(error);
        }
    }

    #handleConnectionError(err) {
        if (err.fatal) {
            this.#handleFatalError(err);
        }
        else {
            Logger.instance.error('A database error occurred', err)
                .catch(console.error);
        }
    }

    /**
     * Handle connection error
     *
     * @param err
     * @private
     */
    #handleFatalError(err) {
        console.error('A fatal database error occurred', err);
        Logger.instance.error('A fatal database error occurred', err)
            .catch(console.error);

        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access to database denied. Make sure your settings and database are set up correctly!');
            process.exit(1);
        }

        this.#connection = null;
        setTimeout(this.#connect.bind(this), 5000);
    }

    /**
     * Create required tables
     *
     * @return {Promise<void>}
     */
    async createTables() {
        await this.query('CREATE TABLE IF NOT EXISTS `channels` (`id` VARCHAR(20) NOT NULL, `settings` TEXT NOT NULL, PRIMARY KEY (`id`), `guildid` VARCHAR(20))');
        await this.query('CREATE TABLE IF NOT EXISTS `guilds` (`id` VARCHAR(20) NOT NULL, `settings` TEXT NOT NULL, PRIMARY KEY (`id`))');
        await this.query('CREATE TABLE IF NOT EXISTS `users` (`id` VARCHAR(20) NOT NULL, `settings` TEXT NOT NULL, PRIMARY KEY (`id`))');
        await this.query('CREATE TABLE IF NOT EXISTS `responses` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `trigger` TEXT NOT NULL, `response` TEXT NOT NULL, `global` BOOLEAN NOT NULL, `channels` TEXT NULL DEFAULT NULL)');
        await this.query('CREATE TABLE IF NOT EXISTS `badWords` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `trigger` TEXT NOT NULL, `punishment` TEXT NOT NULL, `response` TEXT NOT NULL, `global` BOOLEAN NOT NULL, `channels` TEXT NULL DEFAULT NULL, `priority` int NULL)');
        await this.query('CREATE TABLE IF NOT EXISTS `moderations` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `userid` VARCHAR(20) NOT NULL, `action` VARCHAR(10) NOT NULL,`created` bigint NOT NULL, `value` int DEFAULT 0,`expireTime` bigint NULL DEFAULT NULL, `reason` TEXT,`moderator` VARCHAR(20) NULL DEFAULT NULL, `active` BOOLEAN DEFAULT TRUE)');
    }

    /**
     * Execute query and return all results
     *
     * @param {string} sql
     * @param {string|number|null} values
     * @returns {Promise<Object[]>}
     */
    async queryAll(sql, ...values) {
        await this.waitForConnection();
        return (await this.#connection.query(sql, values))[0];
    }

    /**
     * Execute query and return the first result
     *
     * @param {string} sql
     * @param {*} values
     * @returns {Promise<Object|null>}
     */
    async query(sql, ...values) {
        return (await this.queryAll(sql, ...values))[0] ?? null;
    }

    /**
     * Escape table/column names
     * @param {string|string[]} ids
     * @return {string}
     */
    escapeId(ids) {
        return this.#connection.escapeId(ids);
    }

    /**
     * add a moderation
     * @param {import('discord.js').Snowflake}          guildId       id of the guild
     * @param {import('discord.js').Snowflake}          userId        id of the moderated user
     * @param {String}                                  action        moderation type (e.g. 'ban')
     * @param {String}                                  reason        reason for the moderation
     * @param {Number}                                  [duration]    duration of the moderation
     * @param {import('discord.js').Snowflake}          [moderatorId] id of the moderator
     * @param {Number}                                  [value]       strike count
     * @return {Promise<Number>} the id of the moderation
     */
    async addModeration(guildId, userId, action, reason, duration, moderatorId, value= 0) {
        //disable old moderations
        await this.query('UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = ?', guildId, userId, action);

        const now = Math.floor(Date.now()/1000);
        /** @property {Number} insertId*/
        const insert = await this.queryAll('INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator, value) VALUES (?,?,?,?,?,?,?,?)',guildId, userId, action, now, duration ? now + duration : null, reason, moderatorId, value);
        return insert.insertId;
    }
}
