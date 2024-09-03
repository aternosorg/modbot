import * as mysql from 'mysql2/promise';
import logger from './Logger.js';
import config from './Config.js';
import CommentFieldMigration from '../database/migrations/CommentFieldMigration.js';
import {asyncFilter} from '../util/util.js';
import BadWordVisionMigration from '../database/migrations/BadWordVisionMigration.js';
import AutoResponseVisionMigration from '../database/migrations/AutoResponseVisionMigration.js';
import DMMigration from '../database/migrations/DMMigration.js';

/**
 * @import {QueryError} from 'mysql2';
 */

export class Database {
    /**
     * @type {import('mysql2').Connection}
     */
    #connection = null;

    /**
     * @type {{resolve: Function, reject: Function}[]}
     */
    #waiting = [];

    /**
     * @returns {Promise<void>}
     */
    async connect() {
        this.options = config.data.database;
        if (!this.options) {
            throw new Error('Missing database configuration! Make sure your config is up to date!');
        }

        this.options.charset = 'utf8mb4';
        this.options.supportBigNumbers = true;
        this.options.bigNumberStrings = true;
        await this.#connect();
    }

    /**
     * Wait until a working MySQL connection is available
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
        } catch (error) {
            this.#handleFatalError(error);
        }
    }

    #handleConnectionError(err) {
        if (err.fatal) {
            this.#handleFatalError(err);
        } else {
            logger.error('A database error occurred', err)
                .catch(console.error);
        }
    }

    /**
     * Handle connection error
     * @param {QueryError} err
     * @private
     */
    #handleFatalError(err) {
        console.error('A fatal database error occurred', err);
        logger.error('A fatal database error occurred', err)
            .catch(console.error);

        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access to database denied. Make sure your config and database are set up correctly!');
            process.exit(1);
        }

        this.#connection = null;
        setTimeout(this.#connect.bind(this), 5000);
    }

    /**
     * Create required tables
     * @returns {Promise<void>}
     */
    async createTables() {
        await this.query('CREATE TABLE IF NOT EXISTS `channels` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`), `guildid` VARCHAR(20))');
        await this.query('CREATE TABLE IF NOT EXISTS `guilds` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))');
        await this.query('CREATE TABLE IF NOT EXISTS `users` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))');
        await this.query('CREATE TABLE IF NOT EXISTS `responses` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `trigger` TEXT NOT NULL, `response` TEXT NOT NULL, `global` BOOLEAN NOT NULL, `channels` TEXT NULL DEFAULT NULL, `enableVision` BOOLEAN DEFAULT FALSE)');
        await this.query('CREATE TABLE IF NOT EXISTS `badWords` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `trigger` TEXT NOT NULL, `punishment` TEXT NOT NULL, `response` TEXT NOT NULL, `global` BOOLEAN NOT NULL, `channels` TEXT NULL DEFAULT NULL, `priority` int NULL, `dm` TEXT NULL DEFAULT NULL, `enableVision` BOOLEAN DEFAULT FALSE)');
        await this.query('CREATE TABLE IF NOT EXISTS `moderations` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `userid` VARCHAR(20) NOT NULL, `action` VARCHAR(10) NOT NULL, `created` bigint NOT NULL, `value` int DEFAULT 0, `expireTime` bigint NULL DEFAULT NULL, `reason` TEXT, `comment` TEXT NULL DEFAULT NULL, `moderator` VARCHAR(20) NULL DEFAULT NULL, `active` BOOLEAN DEFAULT TRUE)');
        await this.query('CREATE TABLE IF NOT EXISTS `confirmations` (`id` int PRIMARY KEY AUTO_INCREMENT, `data` TEXT NOT NULL, `expires` bigint NOT NULL)');
        await this.query('CREATE TABLE IF NOT EXISTS `safeSearch` (`hash` CHAR(64) PRIMARY KEY, `data` TEXT NOT NULL)');
    }

    async getMigrations() {
        return await asyncFilter([
            new CommentFieldMigration(this),
            new BadWordVisionMigration(this),
            new AutoResponseVisionMigration(this),
            new DMMigration(this),
        ], async migration => await migration.check());
    }

    async runMigrations() {
        const migrations = await this.getMigrations();

        if (migrations.length === 0) {
            return;
        }

        await logger.info(`Running ${migrations.length} migrations`);
        for (let migration of migrations) {
            await migration.run();
        }
    }

    /**
     * Execute query and return all results
     * @param {string} sql
     * @param {string|number|null} values
     * @returns {Promise<object[]>}
     */
    async queryAll(sql, ...values) {
        await this.waitForConnection();
        try {
            return (await this.#connection.query(sql, values))[0];
        } catch (e) {
            this.#handleConnectionError(e);
            throw e;
        }
    }

    /**
     * Execute query and return the first result
     * @param {string} sql
     * @param {*} values
     * @returns {Promise<object|null>}
     */
    async query(sql, ...values) {
        return (await this.queryAll(sql, ...values))[0] ?? null;
    }

    /**
     * Escape table/column names
     * @param {string|string[]} ids
     * @returns {string}
     */
    escapeId(ids) {
        return this.#connection.escapeId(ids);
    }
}

export default new Database();
