import * as mysql from 'mysql2/promise';
import logger from '../bot/Logger.js';
import config from '../bot/Config.js';
import CommentFieldMigration from './migrations/CommentFieldMigration.js';
import {asyncFilter} from '../util/util.js';
import BadWordVisionMigration from './migrations/BadWordVisionMigration.js';
import AutoResponseVisionMigration from './migrations/AutoResponseVisionMigration.js';
import DMMigration from './migrations/DMMigration.js';
import IndexMigration from './migrations/IndexMigration.js';
import * as fs from 'node:fs/promises';

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
        this.options.multipleStatements = true;
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
     * @param {import('mysql2').QueryError} err
     * @private
     */
    #handleFatalError(err) {
        switch (err.code) {
            case 'ER_ACCESS_DENIED_ERROR':
                console.error('Access to database denied. Make sure your config and database are set up correctly!');
                process.exit(1);
                break;

            case 'ER_CLIENT_INTERACTION_TIMEOUT':
                logger.info('Database connection timed out due to inactivity, reconnecting...', err).catch(console.error);
                break;

            default:
                logger.error('A fatal database error occurred, reconnecting...', err).catch(console.error);
        }

        this.#connection = null;
        setTimeout(this.#connect.bind(this), 5000);
    }

    /**
     * Create required tables
     * @returns {Promise<void>}
     */
    async createTables() {
        const schema = await fs.readFile(import.meta.dirname + '/schema.sql', 'utf8');
        await this.queryAll(schema.toString());
    }

    async getMigrations() {
        return await asyncFilter([
            new CommentFieldMigration(this),
            new BadWordVisionMigration(this),
            new AutoResponseVisionMigration(this),
            new DMMigration(this),

            new IndexMigration(this, 'channels', 'guildid', ['guildid']),
            new IndexMigration(this, 'responses', 'guildid_global', ['guildid', 'global']),
            new IndexMigration(this, 'badWords', 'guildid_global', ['guildid', 'global']),
            new IndexMigration(this, 'moderations', 'action_active_expireTime', ['action', 'active', 'expireTime']),
            new IndexMigration(this, 'moderations', 'guildid_userid_action_active', ['guildid', 'userid', 'action', 'active']),
            new IndexMigration(this, 'moderations', 'moderator_guildid_action', ['moderator', 'guildid', 'action']),
            new IndexMigration(this, 'confirmations', 'expires', ['expires']),
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
