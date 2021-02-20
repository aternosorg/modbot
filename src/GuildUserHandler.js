const GuildHandler = require('./GuildHandler');
const Log = require('./Log');
const util = require('./util');

class GuildUserHandler {

    /**
     * @type {module:"discord.js".User}
     */
    user;

    /**
     * @type {GuildHandler}
     */
    guildHandler;

    /**
     * @param {module:"discord.js".User}    user
     * @param {module:"discord.js".Guild}   guild
     */
    constructor(user, guild) {
        this.user = user;
        this.guildHandler = GuildHandler.get(guild);
    }

    /**
     * ban this user from this guild
     * @param {String}                              reason
     * @param {module:"discord.js".User|ClientUser} moderator
     * @param {Number}                              [duration]
     * @return {Promise<void>}
     */
    async ban(reason, moderator, duration){
        await this.dmUser('banned', reason, duration)
        await this.guildHandler.guild.members.ban(this.user.id, {days: 1, reason: `${moderator.username}#${moderator.discriminator} ${duration ? `(${util.secToTime(duration)}) ` : ''}| ${reason}`});
        const id = await this.database.addModeration(this.guildHandler.guild.id, this.user.id, 'ban', reason, duration, moderator.id);
        await Log.logModeration(this.guildHandler.guild.id, moderator, this.user, reason, id, 'ban', { time: util.secToTime(duration) });
    }

    /**
     * send the user a dm about this punishment
     * @param {String}  verb
     * @param {String}  reason
     * @param {Number}  duration
     * @return {Promise<Boolean>} success
     */
    async dmUser(verb, reason, duration) {
        if (duration)
            return await this.guildHandler.sendDM(this.user, `You have been ${verb} from \`${this.guildHandler.guild.name}\` for ${util.secToTime(duration)} | ${reason}`);
        else
            return await this.guildHandler.sendDM(this.user, `You have been ${verb} from \`${this.guildHandler.guild.name}\` | ${reason}`);
    }

}

module.exports = GuildUserHandler;
