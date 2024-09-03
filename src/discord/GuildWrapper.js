import {BaseGuildTextChannel, Collection, DiscordjsErrorCodes, RESTJSONErrorCodes} from 'discord.js';
import RateLimiter from './RateLimiter.js';
import bot from '../bot/Bot.js';
import GuildSettings from '../settings/GuildSettings.js';
import database from '../bot/Database.js';
import logger from '../bot/Logger.js';

/**
 * @import {Guild, Role, Message} from 'discord.js';
 */

export default class GuildWrapper {

    /**
     * Guild Cache
     * @type {Collection<import('discord.js').Snowflake, GuildWrapper>}
     */
    static #cache = new Collection();

    /**
     * Discord guild
     * @type {import('discord.js').Guild}
     */
    guild;

    /**
     * @param {Guild} guild
     */
    constructor(guild) {
        this.guild = guild;
    }

    /**
     * @param {import("discord.js").Snowflake} id
     * @returns {Promise<GuildWrapper>}
     */
    static async fetch(id) {
        try {
            return new this(await bot.client.guilds.fetch(id));
        }
        catch (e) {
            if ([RESTJSONErrorCodes.UnknownGuild, RESTJSONErrorCodes.MissingAccess].includes(e.code)) {
                return null;
            }
            throw e;
        }
    }

    /**
     * get the guild settings of this guild
     * @returns {Promise<GuildSettings>}
     */
    async getSettings() {
        return GuildSettings.get(this.guild.id);
    }

    /**
     * fetch a guild member
     * @param {import('discord.js').Snowflake} id user id
     * @param {boolean} [force] bypass cache
     * @returns {Promise<import('discord.js').GuildMember|null>}
     */
    async fetchMember(id, force = false) {
        try {
            return await this.guild.members.fetch({user: id, force});
        }
        catch (e) {
            if ([
                RESTJSONErrorCodes.UnknownMember,
                RESTJSONErrorCodes.UnknownUser
            ].includes(e.code)) {
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
     * @returns {Promise<null|Role>}
     */
    async fetchRole(id) {
        try {
            return await this.guild.roles.fetch(id);
        }
        catch (e) {
            if ([
                RESTJSONErrorCodes.UnknownRole,
                RESTJSONErrorCodes.MissingAccess,
            ].includes(e.code)) {
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
     * @returns {Promise<null|import('discord.js').GuildBan>}
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
     * @returns {Promise<null|import("discord.js").GuildChannel>}
     */
    async fetchChannel(id) {
        try {
            return await this.guild.channels.fetch(id);
        }
        catch (e) {
            if ([
                RESTJSONErrorCodes.UnknownChannel,
                RESTJSONErrorCodes.MissingAccess,
                DiscordjsErrorCodes.GuildChannelUnowned,
            ].includes(e.code)) {
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
     * @param {string} message
     * @returns {Promise<boolean>} was this successful
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
     * send a message to a channel
     * @param {import('discord.js').Snowflake} channelId
     * @param {import('discord.js').MessagePayload|import('discord.js').MessageOptions} options
     * @returns {Promise<?Message>} Discord message (if it was sent)
     */
    async sendMessageToChannel(channelId, options) {
        if (!channelId) {
            return null;
        }


        const channel = await this.fetchChannel(channelId);
        if (channel && channel instanceof BaseGuildTextChannel) {
            try {
                return await channel.send(options);
            }
            catch (e) {
                if ([
                    RESTJSONErrorCodes.MissingPermissions,
                    RESTJSONErrorCodes.MissingAccess,
                    RESTJSONErrorCodes.UnknownChannel,
                ].includes(e.code)) {
                    await logger.warn(`Failed to send message to ${channel.name} (${channelId})` +
                        `in ${this.guild.name} (${this.guild.id}): ${e.name}`, e);
                } else {
                    throw e;
                }
            }
        }

        return null;
    }

    /**
     * send this message to the guild's log channel
     * @param {import('discord.js').MessagePayload|import('discord.js').MessageCreateOptions} options
     * @returns {Promise<?Message>} Discord message (if it was sent)
     */
    async log(options) {
        const settings = await this.getSettings();
        return this.sendMessageToChannel(settings.logChannel, options);
    }

    /**
     * send this message to the guild's message log channel
     * @param {import('discord.js').MessagePayload|import('discord.js').MessageCreateOptions} options
     * @returns {Promise<?Message>} Discord message (if it was sent)
     */
    async logMessage(options) {
        const settings = await this.getSettings();
        return this.sendMessageToChannel(settings.messageLogChannel, options);
    }

    /**
     * send this message to the guild's join log channel
     * @param {import('discord.js').MessagePayload|import('discord.js').MessageCreateOptions} options
     * @returns {Promise<?Message>} Discord message (if it was sent)
     */
    async logJoin(options) {
        const settings = await this.getSettings();
        return this.sendMessageToChannel(settings.joinLogChannel, options);
    }

    /**
     * delete ALL data for this guild
     * @returns {Promise<void>}
     */
    async deleteData() {
        return Promise.all([
            database.query('DELETE FROM channels WHERE guildid = ?', this.guild.id),
            database.query('DELETE FROM guilds WHERE id = ?', this.guild.id),
            database.query('DELETE FROM responses WHERE guildid = ?', this.guild.id),
            database.query('DELETE FROM badWords WHERE guildid = ?', this.guild.id),
            database.query('DELETE FROM moderations WHERE guildid = ?', this.guild.id)
        ]);
    }

    /**
     * get a guild from cache or create a new one
     * @param {Guild} guild
     * @returns {GuildWrapper}
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
