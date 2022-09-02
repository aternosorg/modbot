import {Collection, RESTJSONErrorCodes} from 'discord.js';
import RateLimiter from './RateLimiter.js';
import Bot from '../bot/Bot.js';

export default class Guild {

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
     * @param {import("discord.js").Snowflake} id
     * @return {Promise<Guild>}
     */
    static async fetch(id) {
        try {
            return new this(await Bot.instance.client.guilds.fetch(id));
        }
        catch (e) {
            if (e.code === RESTJSONErrorCodes.UnknownGuild) {
                return null;
            }
            throw e;
        }
    }

    /**
     * fetch a guild member
     * @param {import('discord.js').Snowflake} id user id
     * @param {boolean} [force] bypass cache
     * @return {Promise<null|GuildMember>}
     */
    async fetchMember(id, force = false) {
        try {
            return this.guild.members.fetch({user: id, force});
        }
        catch (e) {
            if ([RESTJSONErrorCodes.UnknownMember, RESTJSONErrorCodes.UnknownUser].includes(e.code)) {
                return null;
            }
            else {
                throw e;
            }
        }
    }

    /**
     * fetch a role
     * @param {import('discord.js').Snowflake} id role id
     * @return {Promise<null|Role>}
     */
    async fetchRole(id) {
        try {
            return await this.guild.roles.fetch(id);
        }
        catch (e) {
            if (e.code === RESTJSONErrorCodes.UnknownRole) {
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
     * @return {Promise<null|import('discord.js').GuildBan>}
     */
    async fetchBan(id) {
        try {
            return await this.guild.bans.fetch(id);
        }
        catch (e) {
            if (e.code === RESTJSONErrorCodes.UnknownBan) {
                return null;
            }
            else {
                throw e;
            }
        }
    }

    /**
     * fetch a channel
     * @param {import("discord.js").Snowflake} id channel id
     * @return {Promise<null|import("discord.js").GuildChannel>}
     */
    async fetchChannel(id) {
        try {
            return await this.guild.channels.fetch(id);
        }
        catch (e) {
            if (e.code === RESTJSONErrorCodes.UnknownChannel) {
                return null;
            }
            else {
                throw e;
            }
        }
    }

    /**
     * try to send a dm
     * @param {import("discord.js").User} user
     * @param {String} message
     * @return {Promise<boolean>} was this successful
     */
    async sendDM(user, message) {
        if (!await this.fetchMember(user.id)) return false;

        try {
            await RateLimiter.sendDM(this.guild, user, message);
        }
        catch (e) {
            if (e.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser) {
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
     * @param {import("discord.js".Guild)} guild
     * @return {Guild}
     * @deprecated
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
