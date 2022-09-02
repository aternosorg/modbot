const Database = require('../bot/Database.js');
const {Snowflake} = require('discord.js');
const TypeChecker = require('../config/TypeChecker.js');

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
     * @param {Object} data
     * @param {Number} [data.id]
     * @param {Snowflake} data.guildid
     * @param {Snowflake} data.userid
     * @param {String} data.action
     * @param {Number} [data.created]
     * @param {Number} [data.value]
     * @param {String} [data.reason]
     * @param {Number} [data.expireTime]
     * @param {Snowflake} data.moderator
     * @param {boolean} [data.active]
     */
    constructor(data) {
        this.id = data.id;
        this.guildid = data.guildid;
        this.userid = data.userid;
        this.action = data.action;
        this.created = data.created || Math.floor(Date.now()/1000);
        this.value = data.value;
        this.reason = data.reason || 'No reason provided.';
        this.expireTime = data.expireTime;
        this.moderator = data.moderator;
        this.active = !!data.active;
    }

    /**
     * check if the types of this object are a valid Moderation
     * @param {Object} data
     */
    static checkTypes(data) {
        TypeChecker.assertOfTypes(data, ['object'], 'Data object');

        TypeChecker.assertNumber(data.id, 'ID');
        TypeChecker.assertString(data.guildid, 'Guild ID');
        TypeChecker.assertString(data.userid, 'User ID');
        TypeChecker.assertString(data.action, 'Action');
        TypeChecker.assertOfTypes(data.created, ['number','string','undefined'], 'Created', true);
        TypeChecker.assertNumberUndefinedOrNull(data.value, 'Value');
        TypeChecker.assertStringUndefinedOrNull(data.reason, 'Reason');
        TypeChecker.assertOfTypes(data.expireTime, ['number','string','undefined'], 'Expire time', true);
        TypeChecker.assertStringUndefinedOrNull(data.moderator, 'Moderator');
        TypeChecker.assertOfTypes(data.active, ['boolean', 'undefined'], 'Active');
    }

    /**
     * get all moderations for a guild
     * @param guildID
     * @return {Promise<*[]>}
     */
    static async getAll(guildID) {
        const result = [];
        for (const moderation of await Database.getInstance().queryAll('SELECT id, userid, action, created, value, expireTime, reason, moderator, active ' +
            'FROM moderations WHERE guildid = ?', [guildID])) {
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
        return Database.getInstance().query('INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator, value, active) ' +
            'VALUES (?,?,?,?,?,?,?,?,?)', this.getParameters());
    }

    /**
     * get all parameters of this moderation
     * @return {(Snowflake|String|Number)[]}
     */
    getParameters() {
        return [this.guildid, this.userid, this.action, this.created, this.expireTime, this.reason, this.moderator, this.value, this.active];
    }

    /**
     * insert multiple moderations at once
     * @param {Moderation[]} moderations
     * @return {Promise}
     */
    static async bulkSave(moderations) {
        if(!Array.isArray(moderations) || !moderations.length) {
            return;
        }
        moderations = moderations.map(m => m.getParameters());
        return Database.getInstance().queryAll('INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator, value, active) ' +
            `VALUES ${moderations.map(() => '(?,?,?,?,?,?,?,?,?)').join(', ')}`, moderations.flat());
    }
}

module.exports = Moderation;