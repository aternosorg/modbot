const RateLimiter = require('./RateLimiter');
const Discord = require('discord.js');
const {APIErrors} = require('discord.js').Constants;

class Guild {

    /**
     * Guild Cache
     * @type {module:"discord.js".Collection<module:"discord.js".Snowflake, Guild>}
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
     * fetch a guild member
     * @param {module:"discord.js".Snowflake}   id  user id
     * @param {boolean} [force] bypass cache
     * @return {Promise<null|module:"discord.js".GuildMember>}
     */
    async fetchMember(id, force = false) {
        try {
            return await this.guild.members.fetch(id, {force});
        }
        catch (e) {
            if (e.code === APIErrors.UNKNOWN_MEMBER) {
                return null;
            }
            else {
                throw e;
            }
        }
    }

    /**
     * fetch a role
     * @param {Snowflake} id role id
     * @return {Promise<null|module:"discord.js".Role>}
     */
    async fetchRole(id) {
        try {
            return await this.guild.roles.fetch(id);
        }
        catch (e) {
            if (e.code === APIErrors.UNKNOWN_ROLE) {
                return null;
            }
            else {
                throw e;
            }
        }
    }

    /**
     * fetch a ban
     * @param {Snowflake} id user id
     * @return {Promise<null|{reason: String|null}>}
     */
    async fetchBan(id) {
        try {
            return await this.guild.fetchBan(id);
        }
        catch (e) {
            if (e.code === APIErrors.UNKNOWN_BAN) {
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
            if (e.code === APIErrors.CANNOT_MESSAGE_USER) {
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
     * @return {Guild}
     */
    static get(guild) {
        if (this.#cache.has(guild.id))
            return this.#cache.get(guild.id);
        else {
            const newGuild = new Guild(guild);
            this.#cache.set(guild.id, newGuild);
            return newGuild;
        }
    }
}

module.exports = Guild;
