const Guild = require('./Guild');
const Log = require('./Log');
const util = require('./util');
const GuildConfig = require('./GuildConfig');
const {APIErrors} = require('discord.js').Constants;

class Member {

    /**
     * @type {module:"discord.js".User}
     */
    user;

    /**
     * @type {Guild}
     */
    guild;

    /**
     * @type {module:"discord.js".GuildMember}
     */
    member;

    /**
     * @type {Object|null}
     * @property {String|null} reason
     * @property {module:"discord.js".User} user
     */
    banInfo;

    /**
     * @param {module:"discord.js".User}    user
     * @param {module:"discord.js".Guild}   guild
     */
    constructor(user, guild) {
        this.user = user;
        this.guild = Guild.get(guild);
    }

    /**
     * fetch this member
     * @param {boolean} [force] bypass cache
     * @returns {Promise<module:"discord.js".GuildMember>}
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
     * strike this member
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
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
     * @param {module:"discord.js".User|ClientUser} moderator
     * @param {number}                              amount
     * @return {Promise<void>}
     */
    async pardon(database, reason, moderator, amount = 1){
        await this.guild.sendDM(this.user, `${amount} strikes have been pardoned in \`${this.guild.guild.name}\` | ${reason}`);

        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'pardon', reason, null, moderator.id, -amount);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'pardon', {
            amount,
            total: await this.getStrikeSum(database)
        });
    }

    /**
     * ban this user from this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
     * @param {Number}                              [duration]
     * @return {Promise<void>}
     */
    async ban(database, reason, moderator, duration){
        await this.dmPunishedUser('banned', reason, duration, 'from');
        await this.guild.guild.members.ban(this.user.id, {days: 1, reason: `${moderator.username}#${moderator.discriminator} ${duration ? `(${util.secToTime(duration)}) ` : ''}| ${reason}`});
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'ban', reason, duration, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'ban', { time: util.secToTime(duration) });
    }

    /**
     * unban this member
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async unban(database, reason, moderator){
        try {
            await this.guild.guild.members.unban(this.user, `${moderator.username}#${moderator.discriminator} | ${reason}`);
        }
        catch (e) {
            if (e.code !== APIErrors.UNKNOWN_BAN) {
                throw e;
            }
        }
        await database.query('UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = \'ban\'', [this.guild.guild.id, this.user.id]);
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'unban', reason, null, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'unban');
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
     * @param {module:"discord.js".User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async softban(database, reason, moderator){
        await this.dmPunishedUser('softbanned', reason, null, 'from');
        await this.guild.guild.members.ban(this.user.id, {days: 1, reason: `${moderator.username}#${moderator.discriminator} | ${reason}`});
        await this.guild.guild.members.unban(this.user.id, 'softban');
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'softban', reason, null, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'softban');
    }

    /**
     * kick this user from this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async kick(database, reason, moderator){
        await this.dmPunishedUser('kicked', reason, null, 'from');
        if (!this.member && await this.fetchMember() === null) return;
        await this.member.kick(`${moderator.username}#${moderator.discriminator} | ${reason}`);
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'kick', reason, null, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'kick');
    }

    /**
     * mute this user in this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
     * @param {Number}                              [duration]
     * @return {Promise<void>}
     */
    async mute(database, reason, moderator, duration){
        const {mutedRole} = await this._getGuildConfig();
        if (!mutedRole) return Log.log(this.guild.guild.id ,'Can\'t mute user because no muted role is specified');
        await this.dmPunishedUser('muted', reason, duration, 'in');
        if (!this.member) await this.fetchMember();
        if (this.member) {
            await this.member.roles.add(mutedRole, `${moderator.username}#${moderator.discriminator} ${duration ? `(${util.secToTime(duration)}) ` : ''}| ${reason}`);
        }
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'mute', reason, duration, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'mute', { time: util.secToTime(duration) });
    }

    /**
     * unmute this user in this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async unmute(database, reason, moderator){
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const {mutedRole} = await this._getGuildConfig();
            await this.member.roles.remove(mutedRole, `${moderator.username}#${moderator.discriminator} | ${reason}`);
        }
        await database.query('UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = \'mute\'', [this.guild.guild.id, this.user.id]);
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'unmute', reason, null, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'unmute');
    }

    /**
     * is this member muted
     * @param {Database} database
     * @returns {Promise<boolean>}
     */
    async isMuted(database) {
        if (!this.member) await this.fetchMember(true);
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
