const Guild = require('./Guild');
const Log = require('./Log');
const util = require('./util');

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
     * @param {module:"discord.js".User}    user
     * @param {module:"discord.js".Guild}   guild
     */
    constructor(user, guild) {
        this.user = user;
        this.guild = Guild.get(guild);
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
        await this.dmUser('banned', reason, duration)
        await this.guild.guild.members.ban(this.user.id, {days: 1, reason: `${moderator.username}#${moderator.discriminator} ${duration ? `(${util.secToTime(duration)}) ` : ''}| ${reason}`});
        const id = await database.addModeration(this.guild.guild.id, this.user.id, 'ban', reason, duration, moderator.id);
        await Log.logModeration(this.guild.guild.id, moderator, this.user, reason, id, 'ban', { time: util.secToTime(duration) });
    }

    /**
     * send the user a dm about this punishment
     * @param {String}  verb
     * @param {String}  reason
     * @param {Number}  duration
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
