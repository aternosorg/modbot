import {ChannelType, Collection, PermissionFlagsBits, PermissionsBitField, RESTJSONErrorCodes} from 'discord.js';
import config from '../bot/Config.js';
import {BULK_DELETE_LIMIT, FETCH_MESSAGES_LIMIT} from '../util/apiLimits.js';
import bot from '../bot/Bot.js';

/** @type {ChannelType[]} */
export const SENDABLE_CHANNEL_TYPES = [
    ChannelType.GuildText,
    ChannelType.DM,
    ChannelType.GuildVoice,
    ChannelType.GroupDM,
    ChannelType.GuildAnnouncement,
    ChannelType.AnnouncementThread,
    ChannelType.PublicThread,
    ChannelType.PrivateThread,
];

/** @type {ChannelType[]} */
export const LOCKABLE_CHANNEL_TYPES = SENDABLE_CHANNEL_TYPES
    .concat(ChannelType.GuildForum);

export const CHANNEL_LOCK_PERMISSIONS = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.SendMessagesInThreads,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.CreatePrivateThreads,
];

export default class ChannelWrapper {
    /**
     * @param {import('discord.js').GuildChannel|import('discord.js').BaseGuildTextChannel} channel
     */
    constructor(channel) {
        this.channel = channel;
    }

    /**
     * @param {import("discord.js").Snowflake} id
     * @returns {Promise<ChannelWrapper>}
     */
    static async fetch(id) {
        try {
            return new this(await bot.client.channels.fetch(id));
        }
        catch (e) {
            if ([RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.MissingAccess].includes(e.code)) {
                return null;
            }
            throw e;
        }
    }

    sendable() {
        if (!SENDABLE_CHANNEL_TYPES.includes(this.channel.type)) {
            return false;
        }

        return this.channel.permissionsFor(bot.client.user.id).has(
            new PermissionsBitField()
                .add(PermissionFlagsBits.ViewChannel)
                .add(PermissionFlagsBits.SendMessages)
        );
    }

    /**
     * try to send a message
     * @param {string|import('discord.js').MessagePayload|import('discord.js').MessageCreateOptions} options
     */
    async tryToSend(options) {
        try {
            if (this.sendable()) {
                await this.channel.send(options);
            }
        }
        catch (e) {
            if (e.code !== RESTJSONErrorCodes.MissingPermissions) {
                throw e;
            }
        }
    }

    isLockable() {
        if (!LOCKABLE_CHANNEL_TYPES.includes(this.channel.type)) {
            return false;
        }

        const everyonePermissions = this.channel.permissionsFor(this.channel.guild.roles.everyone);
        if (!everyonePermissions.has(PermissionFlagsBits.ViewChannel))
            return false;

        return CHANNEL_LOCK_PERMISSIONS.some(permission => everyonePermissions.has(permission));
    }

    /**
     * get the emoji for this channel type
     * @returns {import('discord.js').APIMessageComponentEmoji}
     */
    getChannelEmoji() {
        const id = this.getChannelEmojiId();
        return id ? {id} : {};
    }

    /**
     * @returns {import('discord.js').Snowflake|null}
     */
    getChannelEmojiId() {
        const emojis = config.data.emoji;

        switch (this.channel.type) {
            case ChannelType.AnnouncementThread:
            case ChannelType.PublicThread:
            case ChannelType.PrivateThread:
                return emojis.thread;

            case ChannelType.GuildAnnouncement:
                return emojis.announcement;

            case ChannelType.GuildForum:
                return emojis.forum;

            case ChannelType.GuildStageVoice:
                return emojis.stage;

            case ChannelType.GuildVoice:
                return emojis.voice;

            default:
                return emojis.channel;
        }
    }

    /**
     * Fetch messages (even more than 100) from a channel
     * @param {number} count
     * @param {import('discord.js').Snowflake|null} before
     * @returns {Promise<Collection<import('discord.js').Snowflake, import('discord.js').Message>>} fetched messages
     */
    async getMessages(count = 100, before = null) {
        let messages = new Collection();
        while (count > 0) {
            const fetched = await this.channel.messages.fetch({
                limit: Math.min(count, FETCH_MESSAGES_LIMIT), before
            });

            if (!fetched.size) {
                return messages;
            }
            count -= fetched.size;
            messages = messages.concat(fetched);
            before = fetched.lastKey();
        }
        return messages;
    }

    /**
     *
     * @param {import('discord.js').Snowflake[]} messages
     * @returns {Promise<void>}
     */
    async bulkDelete(messages) {
        while (messages.length) {
            await this.channel.bulkDelete(messages.slice(0, BULK_DELETE_LIMIT));
            messages = messages.slice(BULK_DELETE_LIMIT);
        }
    }
}