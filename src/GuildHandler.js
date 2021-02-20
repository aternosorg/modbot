const RateLimiter = require('./RateLimiter');
const Discord = require('discord.js');

class GuildHandler {

    /**
     * GuildHandler Cache
     * @type {module:"discord.js".Collection<module:"discord.js".Snowflake, GuildHandler>}
     */
    static #cache = new Discord.Collection();

    /**
     * Discord guild
     * @type {module:"discord.js".Guild}
     */
    guild;

    /**
     *
     * @param {module:"discord.js".Guild} guild
     */
    constructor(guild) {
        this.guild = guild;
    }

    /**
     *
     * @param {module:"discord.js".Snowflake}   id  user id
     * @return {Promise<null|module:"discord.js".GuildMember>}
     */
    async fetchMember(id) {
        try {
            return await this.guild.members.fetch(id);
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
     * @param {module:"discord.js".User}    user
     * @param {String} message
     * @return {Promise<boolean>} was this successful
     */
    async sendDM(user, message) {
        try {
            await RateLimiter.sendDM(this.guild, user, message);
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

    /**
     * get a guild from cache or create a new one
     * @param {module:"discord.js".Guild}   guild
     * @return {GuildHandler}
     */
    static get(guild) {
        if (this.#cache.has(guild.id))
            return this.#cache.get(guild.id)
        else {
            const newGuild = new GuildHandler(guild);
            this.#cache.set(guild.id, newGuild);
            return newGuild;
        }
    }
}

module.exports = GuildHandler;
