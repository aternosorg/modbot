const Discord = require('discord.js');

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

    static #modCountCache = new Discord.Collection();
    static #modCountTimeouts = new Discord.Collection();

    /**
     * send a user a direct message
     * @param {module:"discord.js".Guild}                                   guild
     * @param {module:"discord.js".User|module:"discord.js".GuildMember}    user
     * @param {String}                                                      message
     * @return {Promise<void>}
     */
    static async sendDM(guild, user, message) {
        let count = this.#modCountCache.get(guild.id);
        if (!count) {
            count = await database.query(`SELECT COUNT(*) AS count FROM moderations WHERE guildid = ${guild.id} AND created >= ${Math.floor(Date.now()/1000) - 60*60*24}`);
            count = parseInt(count.count);
        }

        this.#modCountCache.set(guild.id, count + 1);
        if (!this.#modCountTimeouts.has(guild.id)) {
            this.#modCountTimeouts.set(guild.id, setTimeout(() => {
                this.#modCountCache.delete(guild.id);
                this.#modCountTimeouts.delete(guild.id);
            }, 5 * 60 * 1000));
        }
        if (count <= guild.memberCount * 0.05 || count <= 5) {
            await user.send(message);
        }
        else {
            console.log(`Didn't send DM in guild ${guild.id}, count: ${count}`);
        }
    }

}

module.exports = RateLimiter;
