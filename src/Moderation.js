const Database = require('./Database');
const database = Database.getInstance();

class Moderation {

    /**
     * @type {Snowflake}
     */
    id;

    /**
     * @type {Snowflake}
     */
    guildid;

    /**
     * @type {Snowflake}
     */
    userid;

    /**
     * moderation actions:
     * * ban
     * * unban
     * * kick
     * * mute
     * * unmute
     * * softban
     * * strike
     * * pardon
     * @type {String}
     */
    action;

    /**
     * UNIX timestamp of creation (in seconds)
     * @type {Number}
     */
    created;

    /**
     * e.g. strike count
     * @type {Number}
     */
    value;

    /**
     * UNIX timestamp of expiration (in seconds)
     * @type {Number}
     */
    expireTime;

    /**
     * @type {String}
     */
    reason;

    /**
     * @type {Snowflake}
     */
    moderator;

    /**
     * @type {boolean}
     */
    active;

    /**
     * @param {ModerationData|Moderation} data
     */
    constructor(data) {
        this.id = data.id;
        this.guildid = data.guildid;
        this.userid = data.userid;
        this.action = data.action;
        this.created = data.created;
        this.value = data.value;
        this.reason = data.reason;
        this.expireTime = data.expireTime;
        this.moderator = data.moderator;
        this.active = data.active;
    }

    /**
     * get all moderations for a guild
     * @param guildID
     * @return {Promise<*[]>}
     */
    static async getAll(guildID) {
        const result = [];
        for (const moderation of await database.queryAll('SELECT id, userid, action, created, value, expireTime, reason, moderator, active FROM moderations WHERE guildid = ?', [guildID])) {
            result.push(new Moderation(moderation));
        }
        return result;
    }

    /**
     * get duration in seconds
     * @return {null|number}
     */
    getDuration() {
        if (!this.expireTime) return null;
        return this.expireTime - this.created;
    }

    /**
     * add this moderation to the database
     * @return {Promise}
     */
    async save() {
        return database.query('INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator, value) VALUES (?,?,?,?,?,?,?,?)',
            [this.guildid, this.userid, this.action, this.created, this.expireTime, this.reason, this.moderator, this.value]);
    }
}

module.exports = Moderation;