const {
    Collection,
    Snowflake,
    GuildMember,
    Role,
    User,
    GuildBan,
    GuildChannel,
    Constants: { APIErrors },
} = require('discord.js');
const RateLimiter = require('./RateLimiter.js');

class Guild {

    /**
     * Guild Cache
     * @type {Collection<Snowflake, Guild>}
     */
    static #cache = new Collection();

    /**
     * Discord guild
     * @type {Guild}
     */
    guild;

    /**
     * @param {import(discord.js).Guild} guild
     */
    constructor(guild) {
        this.guild = guild;
    }

    /**
     * fetch a guild member
     * @param {Snowflake}   id  user id
     * @param {boolean} [force] bypass cache
     * @return {Promise<null|GuildMember>}
     */
    async fetchMember(id, force = false) {
        try {
            return await this.guild.members.fetch({user: id, force});
        }
        catch (e) {
            if ([APIErrors.UNKNOWN_MEMBER, APIErrors.UNKNOWN_USER].includes(e.code)) {
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
     * @return {Promise<null|Role>}
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
     * @return {Promise<null|GuildBan>}
     */
    async fetchBan(id) {
        try {
            return await this.guild.bans.fetch(id);
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
     * fetch a channel
     * @param {Snowflake} id channel id
     * @return {Promise<null|GuildChannel>}
     */
    async fetchChannel(id) {
        try {
            return await this.guild.channels.fetch(id);
        }
        catch (e) {
            if (e.code === APIErrors.UNKNOWN_CHANNEL) {
                return null;
            }
            else {
                throw e;
            }
        }
    }

    /**
     * try to send a dm
     * @param {User}    user
     * @param {String} message
     * @return {Promise<boolean>} was this successful
     */
    async sendDM(user, message) {
        if (!await this.fetchMember(user.id)) return;
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
     * @param {Guild}   guild
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
