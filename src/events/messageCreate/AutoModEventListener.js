import MessageCreateEventListener from './MessageCreateEventListener.js';
import util from '../../util.js';
import BadWord from '../../database/BadWord.js';
import Member from '../../discord/MemberWrapper.js';
import {PermissionFlagsBits} from 'discord.js';
import GuildConfig from '../../config/GuildConfig.js';
import Bot from '../../bot/Bot.js';

export default class AutoModEventListener extends MessageCreateEventListener {

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<void>}
     */
    async execute(message) {
        if (await this.ignoredByAutomod(message)) {
            return;
        }

        await this.badWords(message);
        await this.caps(message);
        await this.invites(message);
        await this.linkCooldown(message);
        await this.maxMentions(message);
        await this.spam(message);
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
     * @return {Promise<void>}
     */
    async badWords(message) {
        if (message.deleted) {
            return;
        }
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
                    await util.delete(response, { timeout: 5000 });
                }
                if (word.punishment.action !== 'none') {
                    const member = new Member(message.author, message.guild);
                    await member.executePunishment(word.punishment, reason);
                }
                return;
            }
        }
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<void>}
     */
    async caps(message) {

    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<void>}
     */
    async invites(message) {

    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<void>}
     */
    async linkCooldown(message) {

    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<void>}
     */
    async maxMentions(message) {

    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<void>}
     */
    async spam(message) {

    }
}