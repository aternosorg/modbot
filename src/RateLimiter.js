/**
 * Database
 * @type {Database}
 */
let database;

/**
 * limit certain actions
 */
class RateLimiter {

    /**
     * save database
     * @param {Database} db
     */
    static init(db) {
        database = db;
    }

    /**
     * send a user a direct message
     * @param {module:"discord.js".Guild}                                   guild
     * @param {module:"discord.js".User|module:"discord.js".GuildMember}    user
     * @param {String}                                                      message
     * @return {Promise<void>}
     */
    static async sendDM(guild, user, message) {
        let count = await database.query(`SELECT COUNT(*) AS count FROM moderations WHERE guildid = ${guild.id} AND created >= ${Math.floor(Date.now()/1000) - 60*60*24}`);
        count = count.count;

        if (count <= guild.memberCount * 0.01 || count <= 5) {
            await user.send(message);
        }
        else {
            console.log(`Didn't send DM in guild ${guild.id}, count: ${count}`);
        }
    }

}

module.exports = RateLimiter;
