import TypeChecker from '../settings/TypeChecker.js';
import database from '../bot/Database.js';
import UserWrapper from '../discord/UserWrapper.js';
import WhereParameter from './WhereParameter.js';
import KeyValueEmbed from '../embeds/KeyValueEmbed.js';
import {resolveColor} from '../util/colors.js';
import {toTitleCase} from '../util/format.js';
import {userMention} from 'discord.js';
import {formatTime} from '../util/timeutils.js';
import MemberWrapper from '../discord/MemberWrapper.js';
import GuildWrapper from '../discord/GuildWrapper.js';

/**
 * @import {Message} from 'discord.js';
 */

export default class Moderation {

    /**
     * @type {number}
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
     * - ban
     * - unban
     * - kick
     * - mute
     * - unmute
     * - softban
     * - strike
     * - pardon
     * @type {string}
     */
    action;

    /**
     * UNIX timestamp of creation (in seconds)
     * @type {number}
     */
    created;

    /**
     * e.g. strike count
     * @type {number}
     */
    value;

    /**
     * UNIX timestamp of expiration (in seconds)
     * @type {number}
     */
    expireTime;

    /**
     * @type {?string}
     */
    reason;

    /**
     * @type {?string}
     */
    comment;

    /**
     * @type {import('discord.js').Snowflake}
     */
    moderator;

    /**
     * @type {boolean}
     */
    active;

    /**
     * @param {object} data
     * @param {number} [data.id]
     * @param {import('discord.js').Snowflake} data.guildid
     * @param {import('discord.js').Snowflake} data.userid
     * @param {string} data.action
     * @param {?string|number} [data.created]
     * @param {number} [data.value]
     * @param {string} [data.reason]
     * @param {string} [data.comment]
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
        this.comment = data.comment;
        this.expireTime = parseInt(data.expireTime) || null;
        this.moderator = data.moderator;
        this.active = !!data.active;
    }

    /**
     * check if the types of this object are a valid Moderation
     * @param {object} data
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
        TypeChecker.assertStringUndefinedOrNull(data.comment, 'Comment');
        TypeChecker.assertOfTypes(data.expireTime, ['number','string','undefined'], 'Expire time', true);
        TypeChecker.assertStringUndefinedOrNull(data.moderator, 'Moderator');
        TypeChecker.assertOfTypes(data.active, ['boolean', 'undefined'], 'Active');
    }

    /**
     * escaped database fields
     * @returns {string[]}
     */
    static getFields() {
        return ['id', 'guildid', 'userid', 'action', 'created', 'value', 'expireTime', 'reason', 'comment', 'moderator', 'active']
            .map(field => database.escapeId(field));
    }

    /**
     *
     * @param {WhereParameter[]} params
     * @param {?number} limit
     * @param {boolean} sortAscending
     * @returns {Promise<Moderation[]>}
     */
    static async select(params, limit = null, sortAscending = true) {
        const where = params.join(' AND ');
        const values = params.map(p => p.value);
        const fields = this.getFields().join(', ');

        let query = `SELECT ${fields} FROM moderations WHERE ${where} ORDER BY created ${sortAscending ? 'ASC' : 'DESC'}`;
        if (limit) {
            query += ' LIMIT ?';
            values.push(limit);
        }

        return (await database.queryAll(query, ...values))
            .map(data => new Moderation(data));
    }

    /**
     * get all moderations for a guild or member
     * @param {import('discord.js').Snowflake} guildId
     * @param {import('discord.js').Snowflake} [userId]
     * @returns {Promise<Moderation[]>}
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
     * @returns {Promise<?Moderation>}
     */
    static async get(guildId, id) {
        return (await this.select([
            new WhereParameter('guildid', guildId),
            new WhereParameter('id', id),
        ]))[0] ?? null;
    }

    /**
     * insert multiple moderations at once
     * @param {Moderation[]} moderations
     * @returns {Promise}
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
            queries.push(database.queryAll(`INSERT INTO moderations (${this.getFields().slice(1)}) ` +
                `VALUES ${'(?,?,?,?,?,?,?,?,?), '.repeat(current.length).slice(0, - 2)}`, ...current.flat()));
        }
        await Promise.all(queries);
    }

    /**
     * get duration in seconds
     * @returns {null|number}
     */
    getDuration() {
        if (!this.expireTime) return null;
        return this.expireTime - this.created;
    }

    /**
     * add this moderation to the database
     * @returns {Promise<number>}
     */
    async save() {
        const fields = this.constructor.getFields().slice(1);
        if (this.id) {
            await database.query(
                `UPDATE moderations SET ${fields.map(field => `${field} = ?`).join(', ')} WHERE id = ?`,
                ...this.getParameters(), this.id);
        }
        else {
            const result = await database.queryAll(
                `INSERT INTO moderations (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
                ...this.getParameters());
            this.id = result.insertId;
        }
        return this.id;
    }

    /**
     * log this moderation to the guild's log channel
     * @param {?number} total total strike count
     * @returns {Promise<Message>}
     */
    async log(total = null) {
        const user = await this.getUser();
        const moderator = await this.getModerator();
        const member = await this.getMemberWrapper();

        return (await this.getGuildWrapper()).log({
            embeds: [
                new KeyValueEmbed()
                    .setColor(resolveColor(this.action))
                    .setAuthor({
                        name: `Case ${this.id} | ${toTitleCase(this.action)} | ${await member.displayName()}`,
                        iconURL: await member.displayAvatarURL()
                    })
                    .setFooter({text: user.id})
                    .addPair('User', userMention(user.id))
                    .addPair('User ID', user.id)
                    .addPair('Moderator', userMention(moderator.id))
                    .addPair('Moderator ID', moderator.id)
                    .addPairIf(this.expireTime, 'Duration', formatTime(this.expireTime - this.created))
                    .addPairIf(this.value, 'Amount', this.value)
                    .addPairIf(total, 'Total Strikes', total)
                    .addPairIf(this.reason, 'Reason', this.reason?.substring(0, 1024))
                    .addPairIf(this.comment, 'Comment', this.comment?.substring(0, 1024))
            ]
        });
    }

    /**
     * Delete this moderation from the database
     * @returns {Promise}
     */
    async delete() {
        return database.query('DELETE FROM moderations WHERE id = ?', this.id);
    }

    /**
     * get all parameters of this moderation
     * @returns {(import('discord.js').Snowflake|string|number)[]}
     */
    getParameters() {
        return [this.guildid, this.userid, this.action, this.created, this.value, this.expireTime, this.reason, this.comment, this.moderator, this.active];
    }

    /**
     * fetch the user targeted by this moderation.
     * @returns {Promise<import('discord.js').User>}
     */
    async getUser() {
        return await (new UserWrapper(this.userid)).fetchUser();
    }

    /**
     * fetch the guild this moderation was executed in.
     * @returns {Promise<GuildWrapper>}
     */
    async getGuildWrapper() {
        return await GuildWrapper.fetch(this.guildid);
    }

    /**
     * fetch the user targeted by this moderation.
     * @returns {Promise<MemberWrapper>}
     */
    async getMemberWrapper() {
        return new MemberWrapper(await this.getUser(), await this.getGuildWrapper());
    }

    /**
     * fetch the moderator who executed this moderation.
     * @returns {Promise<?import('discord.js').User>}
     */
    async getModerator() {
        if (!this.moderator) {
            return null;
        }

        return await (new UserWrapper(this.moderator)).fetchUser();
    }
}
