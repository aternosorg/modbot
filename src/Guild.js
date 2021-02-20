const RateLimiter = require('./RateLimiter');

class Guild {

    /**
     *
     * @param {module:"discord.js".Guild}       guild
     * @param {module:"discord.js".Snowflake}   id
     * @return {Promise<null|module:"discord.js".GuildMember>}
     */
    static async fetchMember(guild, id) {
        try {
            return await guild.members.fetch(id);
        }
        catch (e) {
            if (e.code === 10007) {
                return null;
            }
            else {
                throw e;
            }
        }
    }

    /**
     * try to send a dm
     * @param {module:"discord.js".Guild} guild
     * @param {module:"discord.js".User}    user
     * @param {String} message
     * @return {Promise<boolean>} was this successful
     */
    static async sendDM(guild, user, message) {
        try {
            await RateLimiter.sendDM(guild, user, message);
        }
        catch (e) {
            if (e.code === 50007) {
                return false;
            }
            else {
                throw e;
            }
        }
        return true;
    }
}

module.exports = Guild;
