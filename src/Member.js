const Guild = require('./Guild');
const Log = require('./Log');
const util = require('./util');
const GuildConfig = require('./config/GuildConfig');
const {APIErrors} = require('discord.js').Constants;
const {
    User,
    GuildMember,
    ClientUser,
    Snowflake,
    GuildBan,
} = require('discord.js');
const Database = require('./Database');
const {Punishment, GuildInfo} = require('./Typedefs');

class Member {

    /**
     * @type {User}
     */
    user;

    /**
     * @type {Guild}
     */
    guild;

    /**
     * @type {GuildMember}
     */
    member;

    /**
     * @type {GuildBan}
     */
    banInfo;

    /**
     * @param {User} user
     * @param {Guild} guild
     */
    constructor(user, guild) {
        this.user = user;
        this.guild = Guild.get(guild);
    }

    /**
     * fetch this member
     * @param {boolean} [force] bypass cache
     * @returns {Promise<GuildMember>}
     */
    async fetchMember(force) {
        this.member = await this.guild.fetchMember(this.user.id, force);
        return this.member;
    }

    /**
     * fetch a ban
     * @returns {Promise<null|{reason: String|null}>}
     */
    async fetchBanInfo() {
        this.banInfo = await this.guild.fetchBan(this.user.id);
        return this.banInfo;
    }

    /**
     * get the guild config
     * @return {Promise<GuildConfig>}
     * @private
     */
    async _getGuildConfig() {
        return GuildConfig.get(this.guild.guild.id);
    }

    /**
     * shorten a reason to a length below 512
     * @param {string} reason
     * @return {string}
     * @private
     */
    _shortenReason(reason) {
        return reason.substring(0, 500) + reason.length > 500 ? '...' : '';
    }

    /**
     * strike this member
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {User|ClientUser} moderator
     * @param {number}                              amount
     * @return {Promise<void>}
     */
    async strike(database, reason, moderator, amount = 1){
        await this.dmPunishedUser('striked', reason, null, 'in');
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'strike', reason, null, moderator.id, amount);
        const total = await this.getStrikeSum(database);
        await Promise.all([
            Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'strike', { amount, total }),
            this.executePunishment((await this._getGuildConfig()).findPunishment(total), database, `Reaching ${total} strikes`, true)
        ]);
    }

    /**
     * get the
     * @param {Database}database
     * @return {Promise<number>}
     */
    async getStrikeSum(database) {
        return (
            await database.query('SELECT SUM(value) AS sum FROM moderations WHERE guildid = ? AND userid = ? AND (action = \'strike\' OR action = \'pardon\')',[this.guild.guild.id, this.user.id])
        )?.sum || 0;
    }

    /**
     * execute this punishment
     * @param {Punishment} punishment
     * @param {Database} database
     * @param {String} reason
     * @param {boolean} [allowEmpty] return if there is no punishment instead of throwing an exception
     * @return {Promise<void>}
     */
    async executePunishment(punishment, database, reason, allowEmpty = false) {
        if (!punishment) {
            if (allowEmpty)
                return;
            else
                throw new Error('Empty punishment');
        }
        if (typeof punishment.duration === 'string') {
            punishment.duration = util.timeToSec(punishment.duration);
        }

        switch (punishment.action.toLowerCase()) {
            case 'ban':
                return this.ban(database, reason, this.user.client.user, punishment.duration);

            case 'kick':
                return this.kick(database, reason, this.user.client.user);

            case 'mute':
                return this.mute(database, reason, this.user.client.user, punishment.duration);

            case 'softban':
                return this.softban(database, reason, this.user.client.user);

            case 'strike':
                return this.strike(database, reason, this.user.client.user);

            case 'dm':
                return this.guild.sendDM(this.user, `Your message in \`${this.guild.guild.name}\` was removed: ` + punishment.message);

            default:
                throw `Unknown punishment action ${punishment.action}`;
        }
    }

    /**
     * pardon strikes from this member
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {User|ClientUser} moderator
     * @param {number}                              amount
     * @return {Promise<void>}
     */
    async pardon(database, reason, moderator, amount = 1){
        await this.guild.sendDM(this.user, `${amount} strikes have been pardoned in \`${this.guild.guild.name}\` | ${reason}`);

        const id = await database.addModeration(/** @type {Snowflake} */ this.guild.guild.id, this.user.id, 'pardon', reason, null, moderator.id, -amount);
        await Log.logModeration(/** @type {GuildInfo} */ this.guild.guild.id, moderator, this.user, reason, id, 'pardon', {
            amount,
            total: await this.getStrikeSum(database)
        });
    }

    /**
     * ban this user from this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {User|ClientUser} moderator
     * @param {Number}                              [duration]
     * @return {Promise<void>}
     */
    async ban(database, reason, moderator, duration){
        await this.dmPunishedUser('banned', reason, duration, 'from');
        await this.guild.guild.members.ban(this.user.id, {
            days: 1,
            reason: this._shortenReason(`${moderator.tag} ${duration ? `(${util.secToTime(duration)}) ` : ''}| ${reason}`)
        });
        const id = await database.addModeration(/** @type {Snowflake} */ this.guild.guild.id, this.user.id, 'ban', reason, duration, moderator.id);
        await Log.logModeration(/** @type {GuildInfo} */ this.guild.guild.id, moderator, this.user, reason, id, 'ban', { time: util.secToTime(duration) });
    }

    /**
     * unban this member
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async unban(database, reason, moderator){
        try {
            await this.guild.guild.members.unban(this.user, this._shortenReason(`${moderator.tag} | ${reason}`));
        }
        catch (e) {
            if (e.code !== APIErrors.UNKNOWN_BAN) {
                throw e;
            }
        }
        await database.query('UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = \'ban\'', [this.guild.guild.id, this.user.id]);
        const id = await database.addModeration(/** @type {Snowflake} */this.guild.guild.id, this.user.id, 'unban', reason, null, moderator.id);
        await Log.logModeration(/** @type {GuildInfo} */ this.guild.guild.id, moderator, this.user, reason, id, 'unban');
    }

    /**
     * is this member banned
     * @param {Database} database
     * @returns {Promise<boolean>}
     */
    async isBanned(database) {
        await this.fetchBanInfo();
        if (this.banInfo) return true;
        const response = await database.query('SELECT * FROM moderations WHERE active = TRUE AND action = \'ban\' AND guildid = ? AND userid = ?', [this.guild.guild.id, this.user.id]);
        return !!response;
    }

    /**
     * softban this user from this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async softban(database, reason, moderator){
        await this.dmPunishedUser('softbanned', reason, null, 'from');
        await this.guild.guild.members.ban(this.user.id, {days: 1, reason: this._shortenReason(`${moderator.tag} | ${reason}`)});
        await this.guild.guild.members.unban(this.user.id, 'softban');
        const id = await database.addModeration(/** @type {Snowflake} */ this.guild.guild.id, this.user.id, 'softban', reason, null, moderator.id);
        await Log.logModeration(/** @type {GuildInfo} */ this.guild.guild.id, moderator, this.user, reason, id, 'softban');
    }

    /**
     * kick this user from this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async kick(database, reason, moderator){
        await this.dmPunishedUser('kicked', reason, null, 'from');
        if (!this.member && await this.fetchMember() === null) return;
        await this.member.kick(this._shortenReason(`${moderator.tag} | ${reason}`));
        const id = await database.addModeration(/** @type {Snowflake} */ this.guild.guild.id, this.user.id, 'kick', reason, null, moderator.id);
        await Log.logModeration(/** @type {GuildInfo} */ this.guild.guild.id, moderator, this.user, reason, id, 'kick');
    }

    /**
     * mute this user in this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {User|ClientUser} moderator
     * @param {Number}                              [duration]
     * @return {Promise<void>}
     */
    async mute(database, reason, moderator, duration){
        const timeout = duration && duration <= util.apiLimits.timeoutLimit;
        let mutedRole;
        if (!timeout) {
            mutedRole = (await this._getGuildConfig()).mutedRole;
            if (!mutedRole) return Log.log(/** @type {GuildInfo} */ this.guild.guild.id, 'Can\'t mute user because no muted role is specified');
        }
        await this.dmPunishedUser('muted', reason, duration, 'in');
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const shortedReason = this._shortenReason(`${moderator.tag} ${duration ? `(${util.secToTime(duration)}) ` : ''}| ${reason}`);
            if (timeout) {
                await this.member.timeout(duration*1000, shortedReason);
            } else {
                await this.member.roles.add(mutedRole, shortedReason);
            }
        }
        const id = await database.addModeration(/** @type {Snowflake} */ this.guild.guild.id, this.user.id, 'mute', reason, duration, moderator.id);
        await Log.logModeration(/** @type {GuildInfo} */ this.guild.guild.id, moderator, this.user, reason, id, 'mute', { time: util.secToTime(duration) });
    }

    /**
     * unmute this user in this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async unmute(database, reason, moderator){
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const {mutedRole} = await this._getGuildConfig();
            if(this.member.roles.cache.has(mutedRole)) {
                await this.member.roles.remove(mutedRole, this._shortenReason(`${moderator.tag} | ${reason}`));
            }
            await this.member.timeout(null);
        }
        await database.query('UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = \'mute\'', [this.guild.guild.id, this.user.id]);
        const id = await database.addModeration(/** @type {Snowflake} */ this.guild.guild.id, this.user.id, 'unmute', reason, null, moderator.id);
        await Log.logModeration(/** @type {GuildInfo} */ this.guild.guild.id, moderator, this.user, reason, id, 'unmute');
    }

    /**
     * is this member muted
     * @param {Database} database
     * @returns {Promise<boolean>}
     */
    async isMuted(database) {
        if (!this.member) await this.fetchMember(true);
        if (this.member.communicationDisabledUntilTimestamp) {
            return true;
        }
        const {mutedRole} = await this._getGuildConfig();
        if (this.member && this.member.roles.cache.get(mutedRole)) return true;
        const response = await database.query('SELECT * FROM moderations WHERE active = TRUE AND action = \'mute\' AND guildid = ? AND userid = ?', [this.guild.guild.id, this.user.id]);
        return !!response;
    }

    /**
     * send the user a dm about this punishment
     * @param {String}  verb
     * @param {String}  reason
     * @param {Number}  [duration]
     * @param {String}  [preposition] default: from
     * @return {Promise<Boolean>} success
     */
    async dmPunishedUser(verb, reason, duration, preposition = 'from') {
        return this.guild.sendDM(this.user,
            `You have been ${verb} ${preposition} \`${this.guild.guild.name}\` ${duration ? `for ${util.secToTime(duration)}` : ''} | ${reason}`
        );
    }

}

module.exports = Member;
