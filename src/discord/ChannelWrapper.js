import {ChannelType, Collection, PermissionFlagsBits, TextChannel} from 'discord.js';
import Config from '../bot/Config.js';
import {BULK_DELETE_LIMIT, FETCH_MESSAGES_LIMIT} from '../util/apiLimits.js';

export const CHANNEL_LOCK_PERMISSIONS = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.AddReactions,
];

export default class ChannelWrapper {
    /**
     * @param {import('discord.js').GuildChannel} channel
     */
    constructor(channel) {
        this.channel = channel;
    }

    isLockable() {
        if (!(this.channel instanceof TextChannel))
            return false;

        const everyonePermissions = this.channel.permissionsFor(this.channel.guild.roles.everyone);
        if (!everyonePermissions.has(PermissionFlagsBits.ViewChannel))
            return false;

        return CHANNEL_LOCK_PERMISSIONS.some(permission => everyonePermissions.has(permission));
    }

    /**
     * get the emoji for this channel type
     * @return {import('discord.js').APIMessageComponentEmoji}
     */
    getChannelEmoji() {
        const id = this.getChannelEmojiId();
        return id ? {id} : {};
    }

    /**
     * @return {import('discord.js').Snowflake|null}
     */
    getChannelEmojiId() {
        const emojis = Config.instance.data.emoji;

        switch (this.channel.type) {
            case ChannelType.AnnouncementThread:
            case ChannelType.PublicThread:
            case ChannelType.PrivateThread:
                return emojis.Thread;

            case ChannelType.GuildAnnouncement:
                return emojis.Announcement;

            case ChannelType.GuildForum:
                return emojis.Forum;

            case ChannelType.GuildStageVoice:
                return emojis.Stage;

            case ChannelType.GuildVoice:
                return emojis.Voice;

            default:
                return emojis.Channel;
        }
    }

    /**
     * Fetch messages (even more than 100) from a channel
     * @param {number} count
     * @param {import('discord.js').Snowflake|null} before
     * @return {Promise<Collection<import('discord.js').Snowflake, import('discord.js').Message>>} fetched messages
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
     * @return {Promise<void>}
     */
    async bulkDelete(messages) {
        while (messages.length) {
            await this.channel.bulkDelete(messages.slice(0, BULK_DELETE_LIMIT));
            messages = messages.slice(BULK_DELETE_LIMIT);
        }
    }
}