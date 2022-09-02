import {BaseGuildTextChannel, Collection, RESTJSONErrorCodes} from 'discord.js';
import RateLimiter from './RateLimiter.js';
import Bot from '../bot/Bot.js';
import GuildConfig from '../config/GuildConfig.js';
import Database from '../bot/Database.js';

export default class GuildWrapper {

    /**
     * Guild Cache
     * @type {Collection<Snowflake, GuildWrapper>}
     */
    static #cache = new Collection();

    /**
     * Discord guild
     * @type {import('discord.js').Guild}
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
     * @return {Promise<GuildWrapper>}
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
     * get the guildconfig of this guild
     * @return {Promise<GuildConfig>}
     */
    async getConfig() {
        return GuildConfig.get(this.guild.id);
    }

    /**
     * fetch a guild member
     * @param {import('discord.js').Snowflake} id user id
     * @param {boolean} [force] bypass cache
     * @return {Promise<import('discord.js').GuildMember|null>}
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
     * @param {import('discord.js').Snowflake} id user id
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
     * send a message to the a channel
     * @param {import('discord.js').Snowflake} channelId
     * @param {import('discord.js').MessagePayload|import('discord.js').MessageOptions} options
     * @return {Promise<?Message>} Discord message (if it was sent)
     */
    async sendMessageToChannel(channelId, options) {
        if (!channelId) {
            return null;
        }

        const channel = await this.fetchChannel(channelId);
        if (channel && channel instanceof BaseGuildTextChannel) {
            return channel.send(options);
        }
        return null;
    }

    /**
     * send this message to the guild's log channel
     * @param {import('discord.js').MessagePayload|import('discord.js').MessageOptions} options
     * @return {Promise<?Message>} Discord message (if it was sent)
     */
    async log(options) {
        const config = await this.getConfig();
        return this.sendMessageToChannel(config.logChannel, options);
    }

    /**
     * send this message to the guild's message log channel
     * @param {import('discord.js').MessagePayload|import('discord.js').MessageOptions} options
     * @return {Promise<?Message>} Discord message (if it was sent)
     */
    async logMessage(options) {
        const config = await this.getConfig();
        return this.sendMessageToChannel(config.messageLogChannel, options);
    }

    /**
     * send this message to the guild's join log channel
     * @param {import('discord.js').MessagePayload|import('discord.js').MessageOptions} options
     * @return {Promise<?Message>} Discord message (if it was sent)
     */
    async logJoin(options) {
        const config = await this.getConfig();
        return this.sendMessageToChannel(config.joinLogChannel, options);
    }

    /**
     * delete ALL data for this guild
     * @return {Promise<void>}
     */
    async deleteData() {
        return Promise.all([
            Database.instance.query('DELETE FROM channels WHERE guildid = ?', this.guild.id),
            Database.instance.query('DELETE FROM guilds WHERE id = ?', this.guild.id),
            Database.instance.query('DELETE FROM responses WHERE guildid = ?', this.guild.id),
            Database.instance.query('DELETE FROM badWords WHERE guildid = ?', this.guild.id),
            Database.instance.query('DELETE FROM moderations WHERE guildid = ?', this.guild.id)
        ]);
    }

    /**
     * get a guild from cache or create a new one
     * @param {import("discord.js".Guild)} guild
     * @return {GuildWrapper}
     * @deprecated
     */
    static get(guild) {
        if (this.#cache.has(guild.id))
            return this.#cache.get(guild.id);
        else {
            const newGuild = new GuildWrapper(guild);
            this.#cache.set(guild.id, newGuild);
            return newGuild;
        }
    }
}

module.exports = GuildWrapper;
