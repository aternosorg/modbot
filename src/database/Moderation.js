import TypeChecker from '../settings/TypeChecker.js';
import Database from '../bot/Database.js';
import UserWrapper from '../discord/UserWrapper.js';
import WhereParameter from './WhereParameter.js';

export default class Moderation {

    /**
     * @type {Number}
     */
    id;

    /**
     * @type {import('discord.js').Snowflake}
     */
    guildid;

    /**
     * @type {import('discord.js').Snowflake}
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
     * @type {import('discord.js').Snowflake}
     */
    moderator;

    /**
     * @type {boolean}
     */
    active;

    /**
     * @param {Object} data
     * @param {Number} [data.id]
     * @param {import('discord.js').Snowflake} data.guildid
     * @param {import('discord.js').Snowflake} data.userid
     * @param {String} data.action
     * @param {?string|number} [data.created]
     * @param {Number} [data.value]
     * @param {String} [data.reason]
     * @param {?string|number} [data.expireTime]
     * @param {import('discord.js').Snowflake} data.moderator
     * @param {boolean} [data.active]
     */
    constructor(data) {
        this.id = data.id;
        this.guildid = data.guildid;
        this.userid = data.userid;
        this.action = data.action;
        this.created = parseInt(data.created) || Math.floor(Date.now()/1000);
        this.value = data.value;
        this.reason = data.reason || 'No reason provided.';
        this.expireTime = parseInt(data.expireTime);
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
     * escaped database fields
     * @return {string}
     */
    static getFields() {
        return ['id', 'userid', 'action', 'created', 'value', 'expireTime', 'reason', 'moderator', 'active']
            .map(field => Database.instance.escapeId(field)).join(', ');
    }

    /**
     *
     * @param {WhereParameter[]} params
     * @return {Promise<Moderation[]>}
     */
    static async select(params) {
        const where = params.join(' AND ');
        const values = params.map(p => p.value);
        const fields = this.getFields();

        return (await Database.instance.queryAll(`SELECT ${fields} FROM moderations WHERE ${where} ORDER BY created ASC`, ...values))
            .map(data => new Moderation(data));
    }

    /**
     * get all moderations for a guild or member
     * @param {import('discord.js').Snowflake} guildId
     * @param {import('discord.js').Snowflake} [userId]
     * @return {Promise<Moderation[]>}
     */
    static async getAll(guildId, userId = null) {
        const params = [new WhereParameter('guildid', guildId)];

        if (userId) {
            params.push(new WhereParameter('userid', userId));
        }

        return await this.select(params);
    }

    /**
     * get a moderation
     * @param {import('discord.js').Snowflake} guildId
     * @param {number} id
     * @return {Promise<?Moderation>}
     */
    static async get(guildId, id) {
        return (await this.select([
            new WhereParameter('guilid', guildId),
            new WhereParameter('id', id),
        ]))[0] ?? null;
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
        let data = moderations.map(m => m.getParameters());

        const queries = [];
        while (data.length) {
            const current = data.slice(0, 100);
            data = data.slice(100);
            queries.push(Database.instance.queryAll('INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator, value, active) ' +
                `VALUES ${'(?,?,?,?,?,?,?,?,?), '.repeat(current.length).slice(0, - 2)}`, ...current.flat()));
        }
        await Promise.all(queries);
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
        return Database.instance.query('INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator, value, active) ' +
            'VALUES (?,?,?,?,?,?,?,?,?)', ...this.getParameters());
    }

    /**
     * Delete this moderation from the database
     * @return {Promise}
     */
    async delete() {
        return Database.instance.query('DELETE FROM moderations WHERE id = ?', this.id);
    }

    /**
     * get all parameters of this moderation
     * @return {(import('discord.js').Snowflake|String|Number)[]}
     */
    getParameters() {
        return [this.guildid, this.userid, this.action, this.created, this.expireTime, this.reason, this.moderator, this.value, this.active];
    }

    /**
     * fetch the user targeted by this moderation.
     * @return {Promise<import('discord.js').User>}
     */
    async getUser() {
        return await (new UserWrapper(this.userid)).fetchUser();
    }
}
