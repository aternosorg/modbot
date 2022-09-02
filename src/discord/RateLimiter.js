const {
    Guild,
    Collection,
    User,
    GuildMember,

} = require('discord.js');
const monitor = require('./Monitor').getInstance();
const Database = require('../bot/Database.js');

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

    static #modCountCache = new Collection();
    static #modCountTimeouts = new Collection();

    /**
     * send a user a direct message
     * @param {Guild} guild
     * @param {User|GuildMember} user
     * @param {String} message
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
            await monitor.warn(`Guild ${guild.name}(${guild.id}) exceeded DM limit`, {
                dms: count,
                memberCount: guild.memberCount,
                guildID: guild.id,
                guildName: guild.name
            });
            console.log(`Didn't send DM in guild ${guild.name}(${guild.id}), count: ${count}`);
        }
    }

}

module.exports = RateLimiter;
