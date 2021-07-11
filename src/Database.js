const mysql = require('mysql');
const monitor = require('./Monitor').getInstance();

class Database {
    /**
     * Database constructor
     *
     * @param options
     */
    constructor(options) {
        this.options = options;
        this.con = null;
        this.waiting = [];
        this._connect();
    }

    /**
     * Wait until a working MySQL connection is available
     *
     * @returns {Promise<void>}
     */
    waitForConnection() {
        return new Promise((resolve, reject) => {
            if (this.con !== null) {
                return resolve();
            }
            this.waiting.push([resolve, reject]);
        });
    }

    /**
     * Connect to MySQL
     *
     * @private
     */
    _connect() {
        let newCon = mysql.createConnection(this.options);
        newCon.on('error', (err) => {
            newCon.end();
            this._handleConnectionError(err);
        });
        newCon.connect((err) => {
            if (err) {
                newCon.end();
                return this._handleConnectionError(err);
            }
            this.con = newCon;
            for (let w of this.waiting) {
                w[0]();
            }
            this.waiting = [];
        });
    }

    /**
     * Handle connection error
     *
     * @param err
     * @private
     */
    _handleConnectionError(err) {
        monitor.error('A fatal database error occurred', err);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access to database denied. Make sure your config and database are set up correctly!');
            process.exit(1);
        }

        this.con = null;
        for (let w of this.waiting) {
            w[1](err);
        }
        this.waiting = [];
        setTimeout(this._connect.bind(this), 5000);
    }

    /**
     * Create required tables
     *
     * @return {Promise<void>}
     */
    async createTables() {
        await this.query('CREATE TABLE IF NOT EXISTS `channels` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`), `guildid` VARCHAR(20))');
        await this.query('CREATE TABLE IF NOT EXISTS `guilds` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))');
        await this.query('CREATE TABLE IF NOT EXISTS `members` (`id` VARCHAR(41) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))');
        await this.query('CREATE TABLE IF NOT EXISTS `responses` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `trigger` TEXT NOT NULL, `response` TEXT NOT NULL, `global` BOOLEAN NOT NULL, `channels` TEXT NULL DEFAULT NULL)');
        await this.query('CREATE TABLE IF NOT EXISTS `badWords` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `trigger` TEXT NOT NULL, `punishment` TEXT NOT NULL, `response` TEXT NOT NULL, `global` BOOLEAN NOT NULL, `channels` TEXT NULL DEFAULT NULL, `priority` int NULL)');
        await this.query('CREATE TABLE IF NOT EXISTS `moderations` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `userid` VARCHAR(20) NOT NULL, `action` VARCHAR(10) NOT NULL,`created` bigint NOT NULL, `value` int DEFAULT 0,`expireTime` bigint NULL DEFAULT NULL, `reason` TEXT,`moderator` VARCHAR(20) NULL DEFAULT NULL, `active` BOOLEAN DEFAULT TRUE)');
    }

    /**
     * Execute query and return all results
     *
     * @param args
     * @returns {Promise<Object[]>}
     */
    queryAll(...args) {
        return new Promise((resolve, reject) => {
            this.waitForConnection()
                .then(() => {
                    this.con.query(...args, (err, res) => {
                        if (err) {
                            if(err.fatal){
                                this.con.end();
                                this._handleConnectionError(err);
                                return this.queryAll(...args).then(resolve).catch(reject);
                            }
                            return reject(err);
                        }
                        resolve(res);
                    });
                })
                .catch(reject);
        });
    }

    /**
     * Execute query and return the first result
     *
     * @param args
     * @returns {Promise<Object|null>}
     */
    async query(...args) {
        return (await this.queryAll(...args))[0] || null;
    }

    /**
     * Escape table/column names
     *
     * @param args  arguments to forward to the mysql escapeId function
     * @return {string}
     */
    escapeId(...args) {
        return mysql.escapeId(...args);
    }

    /**
     * escape a value
     * @param args
     * @returns {string}
     */
    escapeValue(...args) {
        return mysql.escape(...args);
    }

    /**
     * Escape an array of table/column names
     *
     * @param array values that should be escaped
     * @param args  arguments to forward to the mysql escapeId function
     * @return {[]}
     */
    escapeIdArray(array, ...args) {
        const escaped = [];
        for (const element of array) {
            escaped.push(this.escapeId(element, ...args));
        }
        return escaped;
    }

    /**
     * add a moderation
     * @param {module:"discord.js".Snowflake|Snowflake} guildId       id of the guild
     * @param {module:"discord.js".Snowflake|Snowflake} userId        id of the moderated user
     * @param {String}                                  action        moderation type (e.g. 'ban')
     * @param {String}                                  reason        reason for the moderation
     * @param {Number}                                  [duration]    duration of the moderation
     * @param {module:"discord.js".Snowflake|Snowflake} [moderatorId] id of the moderator
     * @param {Number}                                  [value]       strike count
     * @return {Number} the id of the moderation
     */
    async addModeration(guildId, userId, action, reason, duration, moderatorId, value= 0) {
        //disable old moderations
        await this.query('UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = ?', [guildId, userId, action]);

        const now = Math.floor(Date.now()/1000);
        /** @property {Number} insertId*/
        const insert = await this.queryAll('INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator, value) VALUES (?,?,?,?,?,?,?,?)',[guildId, userId, action, now, duration ? now + duration : null, reason, moderatorId, value]);
        return insert.insertId;
    }
}

module.exports = Database;
