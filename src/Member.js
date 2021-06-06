const Guild = require('./Guild');
const Log = require('./Log');
const util = require('./util');
const GuildConfig = require('./GuildConfig');

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
     * @param {module:"discord.js".User}    user
     * @param {module:"discord.js".Guild}   guild
     */
    constructor(user, guild) {
        this.user = user;
        this.guild = Guild.get(guild);
    }

    /**
     * fetch this member
     * @returns {Promise<module:"discord.js".GuildMember>}
     */
    async fetchMember() {
        this.member = await this.guild.fetchMember(this.user.id);
        return this.member;
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
        await this.dmPunishedUser('banned', reason, duration)
        await this.guild.guild.members.ban(this.user.id, {days: 1, reason: `${moderator.username}#${moderator.discriminator} ${duration ? `(${util.secToTime(duration)}) ` : ''}| ${reason}`});
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'ban', reason, duration, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'ban', { time: util.secToTime(duration) });
    }

    /**
     * softban this user from this guild
     * @param {Database}                            database
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
     * @return {Promise<void>}
     */
    async softban(database, reason, moderator){
        await this.dmPunishedUser('softbanned', reason)
        await this.guild.guild.members.ban(this.user.id, {days: 1, reason: `${moderator.username}#${moderator.discriminator} | ${reason}`});
        await this.guild.guild.members.unban(this.user.id, `softban`);
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
        await this.dmPunishedUser('kicked', reason)
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
        await this.dmPunishedUser('muted', reason, duration)
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const {mutedRole} = await GuildConfig.get(this.guild.guild.id)
            await this.member.roles.add(mutedRole, `${moderator.username}#${moderator.discriminator} ${duration ? `(${util.secToTime(duration)}) ` : ''}| ${reason}`);
        }
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'mute', reason, duration, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'mute', { time: util.secToTime(duration) });
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
