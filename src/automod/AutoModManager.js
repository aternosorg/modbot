import {bold, Collection, PermissionFlagsBits, RESTJSONErrorCodes, ThreadChannel, userMention} from 'discord.js';
import GuildSettings from '../settings/GuildSettings.js';
import bot from '../bot/Bot.js';
import MemberWrapper from '../discord/MemberWrapper.js';
import BadWord from '../database/BadWord.js';
import Member from '../discord/MemberWrapper.js';
import ChannelSettings from '../settings/ChannelSettings.js';
import {formatTime} from '../util/timeutils.js';
import RepeatedMessage from './RepeatedMessage.js';
import SafeSearch from './SafeSearch.js';
import logger from '../bot/Logger.js';
import cloudVision from '../apis/CloudVision.js';

export class AutoModManager {
    #safeSearchCache;

    get #safeSearch() {
        return this.#safeSearchCache ??= new SafeSearch();
    }

    /**
     * how long should a response be shown
     * @type {number}
     */
    #RESPONSE_TIMEOUT = 5000;

    /**
     * @type {Collection<string, number>}
     */
    #cooldowns = new Collection();

    #COOLDOWN_CHECKS = [
        this.attachmentCoolDown,
        this.linkCoolDown,
        this.spam,
    ];

    #CONTENT_CHECKS = [
        this.#safeSearchDetection,
        this.#badWords,
        this.#caps,
        this.#invites
    ];

    constructor() {
        setInterval(this.cleanUpCaches.bind(this), 5000);
    }

    /**
     * run all checks on a message
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async checkMessage(message) {
        await this.#runChecks(message, ...this.#CONTENT_CHECKS, ...this.#COOLDOWN_CHECKS);
    }

    /**
     * run all content checks on a message, don't run any cooldown checks
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async checkMessageEdit(message) {
        await this.#runChecks(message, ...this.#CONTENT_CHECKS);
    }

    /**
     *
     * @param {import('discord.js').Message} message
     * @param {(message: import('discord.js').Message) => Promise<boolean>} checks
     * @returns {Promise<void>}
     */
    async #runChecks(message, ...checks) {
        if (await this.#ignoredByAutomod(message)) {
            return;
        }

        for (const fn of checks) {
            if (await fn.bind(this)(message)) {
                if (message.member && !message.member.isCommunicationDisabled()) {
                    try {
                        await message.member.timeout(30 * 1000);
                    } catch (e) {
                        if (e.code !== RESTJSONErrorCodes.MissingPermissions) {
                            throw e;
                        }
                    }
                }
                return;
            }
        }
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<boolean>}
     */
    async #ignoredByAutomod(message) {
        if (!message.guild || message.system || message.author.bot) {
            return true;
        }
        const guildSettings = await GuildSettings.get(message.guild.id);
        return message.member.permissions.has(PermissionFlagsBits.ManageMessages) || guildSettings.isProtected(message.member);
    }

    /**
     * delete the message and warn the user
     * @param {import('discord.js').Message} message
     * @param {?string} reason
     * @param {string} warning
     * @returns {Promise<true>}
     */
    async #deleteAndWarn(message, reason, warning) {
        try {
            await bot.delete(message, reason);
        } catch (e) {
            if (e.code !== RESTJSONErrorCodes.MissingPermissions) {
                throw e;
            }
            const channel = /** @type {import('discord.js').GuildTextBasedChannel} */ message.channel;
            await logger.warn(`Missing permissions to delete message in channel ${channel?.name} (${message.channelId}) of guild ${message.guild?.name} (${message.guildId})`, e);
            return true;
        }
        await this.#sendWarning(message, warning);
        return true;
    }

    /**
     * send a temporary warning message mentioning the user
     * @param {import('discord.js').Message} message
     * @param {string} warning
     * @returns {Promise<void>}
     */
    async #sendWarning(message, warning) {
        try {
            const response = await (/** @type {import('discord.js').TextBasedChannelFields} */ message.channel)
                .send(userMention(message.author.id) + ' ' + warning);
            await bot.delete(response, null, this.#RESPONSE_TIMEOUT);
        } catch (e) {
            if (e.code !== RESTJSONErrorCodes.MissingPermissions) {
                throw e;
            }
        }
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<boolean>} has the message been deleted
     */
    async #safeSearchDetection(message) {
        if (!await this.#safeSearch.isEnabledInGuild(message.guild) || (/** @type {import('discord.js').TextBasedChannelFields} */ message.channel).nsfw) {
            return false;
        }

        const guildSettings = await GuildSettings.get(message.guild.id);
        const likelihood = await this.#safeSearch.detect(message);
        if (!likelihood || likelihood.value < (guildSettings.safeSearch.likelihood ?? 1)) {
            return false;
        }

        await this.#deleteAndWarn(message, `Detected ${likelihood.type} image`, 'You can\'t post such images here!');
        if (likelihood.value === 2 && guildSettings.safeSearch.strikes) {
            const member = new MemberWrapper(message.author, message.guild);
            await member.strike(`Posting images containing ${likelihood.type} content`, null, bot.client.user, guildSettings.safeSearch.strikes);
        }

        return true;
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<boolean>} has the message been deleted
     */
    async #badWords(message) {
        let channel = message.channel;
        if (channel instanceof ThreadChannel) {
            channel = (/** @type {import('discord.js').ThreadChannel} */ channel).parent;
        }

        const words = (/** @type {Collection<number, BadWord>} */ await BadWord.get(channel.id, message.guild.id))
            .sort((a, b) => b.priority - a.priority);

        for (let word of words.values()) {
            if (word.matches(message.content)) {
                await this.#deleteBadWordMessage(word, message);
                return true;
            }
        }

        if (!cloudVision.isEnabled || !(await GuildSettings.get(message.guild.id)).isFeatureWhitelisted) {
            return false;
        }

        let texts = null;
        for (let word of words.values()) {
            if (word.enableVision && word.trigger.supportsImages()) {
                texts ??= await cloudVision.getImageText(message);
                for (const text of texts) {
                    if (word.matches(text)) {
                        await this.#deleteBadWordMessage(word, message);
                        return true;
                    }
                }

            }
        }

        return false;
    }

    /**
     * @param {BadWord} word
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async #deleteBadWordMessage(word, message) {
        const reason = 'Using forbidden words or phrases';
        const comment = `(Filter ID: ${word.id})`;
        await bot.delete(message, reason + ' ' + comment);
        if (word.response !== 'disabled') {
            await this.#sendWarning(message, word.getResponse());
        }

        const member = new Member(message.author, message.guild);
        if (word.punishment.action !== 'none') {
            await member.executePunishment(word.punishment, reason, comment);
        }
        if (word.dm) {
            await member.guild.sendDM(member.user, `Your message in ${bold(message.guild.name)} was removed: ` + word.dm);
        }
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<boolean>} has the message been deleted
     */
    async #caps(message) {
        const guildSettings = await GuildSettings.get(message.guild.id);
        if (!guildSettings.caps) {
            return false;
        }

        const uppercase = (message.content.match(/[A-Z]/g) ?? []).length;
        const lowercase = (message.content.match(/[a-z]/g) ?? []).length;

        if (uppercase <= 5 || (uppercase / (lowercase + uppercase) < 0.7)) {
            return false;
        }

        return await this.#deleteAndWarn(message, 'Using too many capital letters', 'Don\'t use that many capital letters!');
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<boolean>} has the message been deleted
     */
    async #invites(message) {
        if (!this.includesInvite(message.content)) {
            return false;
        }

        const guildSettings = await GuildSettings.get(message.guild.id);
        const channelSettings = await ChannelSettings.get(message.channel.id);
        const allowed = channelSettings.invites ?? guildSettings.invites;

        if (allowed) {
            return false;
        }

        return await this.#deleteAndWarn(message, 'Sending invite links', 'Invites are not allowed here!');
    }

    includesInvite(string) {
        return ['discord.gg', 'discord.com/invite', 'discordapp.com/invite', 'invite.gg', 'discord.me', 'top.gg/servers', 'dsc.gg']
            .some(url => string.match(new RegExp(url + '/\\w+')));
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<boolean>} has the message been deleted
     */
    async linkCoolDown(message) {
        if (!message.content.match(/https?:\/\//i)) {
            return false;
        }

        const guild = await GuildSettings.get(message.guild.id);

        if (guild.linkCooldown === -1) {
            return false;
        }

        const now = Math.floor(Date.now() / 1000),
            key = `link-${message.guild.id}-${message.author.id}`,
            coolDownEnd = (this.#cooldowns.get(key) ?? 0) + guild.linkCooldown;
        if (coolDownEnd <= now) {
            this.#cooldowns.set(key, now);
            return false;
        }

        return await this.#deleteAndWarn(message, 'Sending links too quickly', `You can post a link again in ${formatTime(coolDownEnd - now) || '1s'}!`);
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<boolean>} has the message been deleted
     */
    async attachmentCoolDown(message) {
        if (!message.attachments.size) {
            return false;
        }

        const guild = await GuildSettings.get(message.guild.id);

        if (guild.attachmentCooldown === -1) {
            return false;
        }

        const now = Math.floor(Date.now() / 1000),
            key = `attachment-${message.guild.id}-${message.author.id}`,
            coolDownEnd = (this.#cooldowns.get(key) ?? 0) + guild.attachmentCooldown;
        if (coolDownEnd <= now) {
            this.#cooldowns.set(key, now);
            return false;
        }

        return await this.#deleteAndWarn(message, 'Sending attachments too quickly', `You can post an attachment again in ${formatTime(coolDownEnd - now) || '1s'}!`);
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<boolean>}
     */
    async spam(message) {
        const guildSettings = await GuildSettings.get(message.guild.id);
        if (guildSettings.antiSpam === -1 && guildSettings.similarMessages === -1) {
            return false;
        }

        RepeatedMessage.add(message);
        if (guildSettings.antiSpam !== -1 && await RepeatedMessage.checkSpam(message, guildSettings.antiSpam, this.#RESPONSE_TIMEOUT)) {
            return await this.#deleteAndWarn(message, 'Sending messages to quickly', 'Slow down, you\'re sending messages to quickly!');
        }
        else if (guildSettings.similarMessages !== -1 && await RepeatedMessage.checkSimilar(message, guildSettings.similarMessages, this.#RESPONSE_TIMEOUT)) {
            return await this.#deleteAndWarn(message, 'Repeating messages', 'Stop repeating your messages!');
        }
        return false;
    }

    cleanUpCaches() {
        for (const [key, time] of this.#cooldowns.entries()) {
            if (time < Math.floor(Date.now() / 1000)) {
                this.#cooldowns.delete(key);
            }
        }
    }
}

export default new AutoModManager();
