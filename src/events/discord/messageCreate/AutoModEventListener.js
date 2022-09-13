import MessageCreateEventListener from './MessageCreateEventListener.js';
import BadWord from '../../../database/BadWord.js';
import Member from '../../../discord/MemberWrapper.js';
import {Collection, PermissionFlagsBits} from 'discord.js';
import GuildConfig from '../../../config/GuildConfig.js';
import Bot from '../../../bot/Bot.js';
import ChannelConfig from '../../../config/ChannelConfig.js';
import {formatTime} from '../../../util/timeutils.js';
import Punishment from '../../../database/Punishment.js';
import RepeatedMessage from './RepeatedMessage.js';

export default class AutoModEventListener extends MessageCreateEventListener {

    /**
     * how long should a response be shown
     * @type {number}
     */
    RESPONSE_TIMEOUT = 5000;

    /**
     * @type {Collection<string, number>}
     */
    linkCoolDowns = new Collection();

    constructor() {
        super();
        setInterval(this.cleanUpCaches.bind(this), 5000);
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<void>}
     */
    async execute(message) {
        if (await this.ignoredByAutomod(message)) {
            return;
        }

        for (const fn of [this.badWords, this.caps, this.invites, this.linkCoolDown, this.maxMentions, this.spam]) {
            if (await fn.bind(this)(message)) {
                return;
            }
        }
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<boolean>}
     */
    async ignoredByAutomod(message) {
        if (!message.guild || message.system || message.author.bot) {
            return true;
        }
        const guildconfig = await GuildConfig.get(message.guild.id);
        return message.member.permissions.has(PermissionFlagsBits.ManageMessages) || guildconfig.isProtected(message.member);
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<boolean>} has the message been deleted
     */
    async badWords(message) {
        /** @type {import('discord.js').TextChannel|import('discord.js').VoiceChannel}*/
        const channel = message.channel;

        const words = (/** @type {Collection<number, BadWord>} */ await BadWord.get(message.channel.id, message.guild.id))
            .sort( (a,b) => b.priority - a.priority);
        for (let word of words.values()) {
            if (word.matches(message)) {
                const reason = `Using forbidden words or phrases (Filter ID: ${word.id})`;
                await Bot.instance.delete(message, reason);
                if (word.response !== 'disabled') {
                    const response = await channel.send(`<@!${message.author.id}>` + word.getResponse());
                    await Bot.instance.delete(response, null, this.RESPONSE_TIMEOUT);
                }
                if (word.punishment.action !== 'none') {
                    const member = new Member(message.author, message.guild);
                    await member.executePunishment(word.punishment, reason);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<boolean>} has the message been deleted
     */
    async caps(message) {
        const uppercase = (message.content.match(/[A-Z]/g) ?? []).length;
        const lowercase = (message.content.match(/[a-z]/g) ?? []).length;

        if (uppercase <= 5 || (uppercase / (lowercase + uppercase) < 0.7)) {
            return false;
        }

        await Bot.instance.delete(message, 'Too many caps');
        const response = await message.channel.send(`<@!${message.author.id}> Don't use that many capital letters!`);
        await Bot.instance.delete(response, null, this.RESPONSE_TIMEOUT);
        return true;
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<boolean>} has the message been deleted
     */
    async invites(message) {
        if (!this.includesInvite(message.content)) {
            return false;
        }

        const guildConfig = await GuildConfig.get(message.guild.id);
        const channelConfig = await ChannelConfig.get(message.channel.id);
        const allowed = channelConfig.invites ?? guildConfig.invites;

        if (allowed) {
            return false;
        }

        await Bot.instance.delete(message, 'Invites are not allowed here');
        const response = await message.channel.send(`<@!${message.author.id}> Invites are not allowed here!`);
        await Bot.instance.delete(response, null, this.RESPONSE_TIMEOUT);
        return true;
    }

    includesInvite(string) {
        return ['discord.gg','discord.com/invite', 'discordapp.com/invite', 'invite.gg', 'discord.me', 'top.gg/servers', 'dsc.gg']
            .some(url => string.match(new RegExp(url + '/\\w+')));
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<boolean>} has the message been deleted
     */
    async linkCoolDown(message) {
        if (!message.content.match(/https?:\/\//i)) {
            return false;
        }

        const guild = await GuildConfig.get(message.guild.id);

        if (guild.linkCooldown === -1) {
            return false;
        }

        const now = Math.floor(Date.now() / 1000),
            key = `${message.guild.id}-${message.author.id}`,
            coolDownEnd = (this.linkCoolDowns.get(key) ?? 0) + guild.linkCooldown;
        if (coolDownEnd <= now) {
            this.linkCoolDowns.set(key, now);
            return false;
        }
        await Bot.instance.delete(message, 'Sending too many links');
        const response = await message.channel.send(
            `<@!${message.author.id}> You can post a link again in ${formatTime(coolDownEnd - now) || '1s'}!`);
        await Bot.instance.delete(response, null, this.RESPONSE_TIMEOUT);
        return true;
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<boolean>} has the message been deleted
     */
    async maxMentions(message) {
        /** @type {GuildConfig} */
        const guildConfig = await GuildConfig.get(message.guild.id);
        if (guildConfig.maxMentions === -1 || message.mentions.users.size <= guildConfig.maxMentions) {
            return false;
        }

        const reason = `Mentioning ${message.mentions.users.size} users`;
        await Bot.instance.delete(message, reason);
        const response = await message.channel.send(`<@!${message.author.id}> You're not allowed to mention more than ${guildConfig.maxMentions} users!`);
        await Bot.instance.delete(response, null, this.RESPONSE_TIMEOUT);
        await (new Member(message.author, message.guild))
            .executePunishment(new Punishment({ action: 'strike' }), reason);
        return true;
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<boolean>}
     */
    async spam(message) {
        const guildConfig = await GuildConfig.get(message.guild.id);
        if (guildConfig.antiSpam === -1 && guildConfig.similarMessages === -1) {
            return false;
        }

        RepeatedMessage.add(message);
        return (guildConfig.antiSpam !== -1 && await RepeatedMessage.checkSpam(message, guildConfig.antiSpam, this.RESPONSE_TIMEOUT))
            || (guildConfig.similarMessages !== -1 && await RepeatedMessage.checkSimilar(message, guildConfig.similarMessages, this.RESPONSE_TIMEOUT));
    }

    cleanUpCaches() {
        for (const [key, time] of this.linkCoolDowns.entries()) {
            if (time < Math.floor(Date.now()/1000)) {
                this.linkCoolDowns.delete(key);
            }
        }
    }
}