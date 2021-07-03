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
     * ban this user from this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
     * @param {Number}                              [duration]
     * @return {Promise<void>}
     */
    async ban(database, reason, moderator, duration){
        await this.dmPunishedUser('banned', reason, duration);
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
        await this.dmPunishedUser('softbanned', reason);
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
        await this.dmPunishedUser('kicked', reason);
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
        await this.dmPunishedUser('muted', reason, duration);
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const {mutedRole} = await GuildConfig.get(this.guild.guild.id);
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
            const {mutedRole} = await GuildConfig.get(this.guild.guild.id);
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
        const {mutedRole} = await GuildConfig.get(this.guild.guild.id);
        if (this.member && this.member.roles.cache.get(mutedRole)) return true;
        const response = await database.query('SELECT * FROM moderations WHERE active = TRUE AND action = \'mute\' AND guildid = ? AND userid = ?', [this.guild.guild.id, this.user.id]);
        return !!response;
    }

    /**
     * send the user a dm about this punishment
     * @param {String}  verb
     * @param {String}  reason
     * @param {Number}  [duration]
     * @return {Promise<Boolean>} success
     */
    async dmPunishedUser(verb, reason, duration) {
        if (duration)
            return await this.guild.sendDM(this.user, `You have been ${verb} from \`${this.guild.guild.name}\` for ${util.secToTime(duration)} | ${reason}`);
        else
            return await this.guild.sendDM(this.user, `You have been ${verb} from \`${this.guild.guild.name}\` | ${reason}`);
    }

}

module.exports = Member;
