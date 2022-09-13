import GuildSettings from '../settings/GuildSettings.js';
import {EmbedBuilder, Guild, RESTJSONErrorCodes} from 'discord.js';
import {formatTime, parseTime} from '../util/timeutils.js';
import Database from '../bot/Database.js';
import GuildWrapper from './GuildWrapper.js';
import {resolveColor} from '../util/colors.js';
import {toTitleCase} from '../util/util.js';
import {TIMEOUT_LIMIT} from '../util/apiLimits.js';

export default class MemberWrapper {

    /**
     * @type {User}
     */
    user;

    /**
     * @type {GuildWrapper}
     */
    guild;

    /**
     * @type {GuildMember|null}
     */
    member;

    /**
     * @type {import('discord.js').GuildBan}
     */
    banInfo;

    /**
     * @param {User} user
     * @param {GuildWrapper|import('discord.js').Guild} guild
     */
    constructor(user, guild) {
        this.user = user;
        this.guild = guild instanceof Guild ? new GuildWrapper(guild) : guild;
    }

    /**
     * fetch this member
     * @param {boolean} [force] bypass cache
     * @returns {Promise<?GuildMember>}
     */
    async fetchMember(force) {
        this.member = await this.guild.fetchMember(this.user.id, force);
        return this.member;
    }

    /**
     * fetch a ban
     * @returns {Promise<null|{reason: String|null}>}
     */
    async fetchBanInfo() {
        this.banInfo = await this.guild.fetchBan(this.user.id);
        return this.banInfo;
    }

    /**
     * get the guild settings
     * @return {Promise<GuildSettings>}
     * @private
     */
    async _getGuildConfig() {
        return GuildSettings.get(this.guild.guild.id);
    }

    /**
     * shorten a reason to a length below 512
     * @param {string} reason
     * @return {string}
     * @private
     */
    _shortenReason(reason) {
        return reason.substring(0, 500) + reason.length > 500 ? '...' : '';
    }

    /**
     * strike this member
     * @param {String}                              reason
     * @param {User|import('discord.js').ClientUser} moderator
     * @param {number}                              amount
     * @return {Promise<void>}
     */
    async strike(reason, moderator, amount = 1){
        await this.dmPunishedUser('striked', reason, null, 'in');
        const id = await Database.instance.addModeration(this.guild.guild.id, this.user.id, 'strike', reason, null, moderator.id, amount);
        const total = await this.getStrikeSum();
        await Promise.all([
            this.#logModeration(moderator, reason, id, 'strike', null, amount, total),
            this.executePunishment((await this._getGuildConfig()).findPunishment(total), `Reaching ${total} strikes`, true)
        ]);
    }

    /**
     * get the
     * @return {Promise<number>}
     */
    async getStrikeSum() {
        return (await Database.instance.query(
            'SELECT SUM(value) AS sum FROM moderations WHERE guildid = ? AND userid = ? AND (action = \'strike\' OR action = \'pardon\')',
            this.guild.guild.id, this.user.id)
        )?.sum || 0;
    }

    /**
     * execute this punishment
     * @param {Punishment} punishment
     * @param {String} reason
     * @param {boolean} [allowEmpty] return if there is no punishment instead of throwing an exception
     * @return {Promise<void>}
     */
    async executePunishment(punishment, reason, allowEmpty = false) {
        if (!punishment) {
            if (allowEmpty)
                return;
            else
                throw new Error('Empty punishment');
        }
        if (typeof punishment.duration === 'string') {
            punishment.duration = parseTime(punishment.duration);
        }

        switch (punishment.action.toLowerCase()) {
            case 'ban':
                return this.ban(reason, this.user.client.user, punishment.duration);

            case 'kick':
                return this.kick(reason, this.user.client.user);

            case 'mute':
                return this.mute(reason, this.user.client.user, punishment.duration);

            case 'softban':
                return this.softban(reason, this.user.client.user);

            case 'strike':
                return this.strike(reason, this.user.client.user);

            case 'dm':
                return this.guild.sendDM(this.user, `Your message in \`${this.guild.guild.name}\` was removed: ` + punishment.message);

            default:
                throw `Unknown punishment action ${punishment.action}`;
        }
    }

    /**
     * pardon strikes from this member
     * @param {String}                              reason
     * @param {User|import('discord.js').ClientUser} moderator
     * @param {number}                              amount
     * @return {Promise<void>}
     */
    async pardon(reason, moderator, amount = 1){
        await this.guild.sendDM(this.user, `${amount} strikes have been pardoned in \`${this.guild.guild.name}\` | ${reason}`);

        const id = await Database.instance.addModeration(this.guild.guild.id, this.user.id, 'pardon', reason, null, moderator.id, -amount);
        await this.#logModeration(moderator, reason, id, 'pardon', null, amount, await this.getStrikeSum());
    }

    /**
     * ban this user from this guild
     * @param {String}                              reason
     * @param {User|import('discord.js').ClientUser} moderator
     * @param {Number}                              [duration]
     * @return {Promise<void>}
     */
    async ban(reason, moderator, duration){
        await this.dmPunishedUser('banned', reason, duration, 'from');
        await this.guild.guild.members.ban(this.user.id, {
            deleteMessageDays: 1,
            reason: this._shortenReason(`${moderator.tag} ${duration ? `(${formatTime(duration)}) ` : ''}| ${reason}`)
        });
        const id = await Database.instance.addModeration(this.guild.guild.id, this.user.id, 'ban', reason, duration, moderator.id);
        await this.#logModeration(moderator, reason, id, 'ban', formatTime(duration));
    }

    /**
     * unban this member
     * @param {String}                              reason
     * @param {User|import('discord.js').ClientUser} moderator
     * @return {Promise<void>}
     */
    async unban(reason, moderator){
        try {
            await this.guild.guild.members.unban(this.user, this._shortenReason(`${moderator.tag} | ${reason}`));
        }
        catch (e) {
            if (e.code !== RESTJSONErrorCodes.UnknownBan) {
                throw e;
            }
        }
        await Database.instance.query(
            'UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = \'ban\'',
            this.guild.guild.id, this.user.id);
        const id = await Database.instance.addModeration(this.guild.guild.id, this.user.id, 'unban', reason, null, moderator.id);
        await this.#logModeration(moderator, reason, id, 'unban');
    }

    /**
     * is this member banned
     * @returns {Promise<boolean>}
     */
    async isBanned() {
        await this.fetchBanInfo();
        return this.banInfo || await Database.instance.query(
            'SELECT * FROM moderations WHERE active = TRUE AND action = \'ban\' AND guildid = ? AND userid = ?',
            this.guild.guild.id, this.user.id);
    }

    /**
     * softban this user from this guild
     * @param {String}                              reason
     * @param {User|import('discord.js').ClientUser} moderator
     * @return {Promise<void>}
     */
    async softban(reason, moderator){
        await this.dmPunishedUser('softbanned', reason, null, 'from');
        await this.guild.guild.members.ban(this.user.id, {deleteMessageDays: 1, reason: this._shortenReason(`${moderator.tag} | ${reason}`)});
        await this.guild.guild.members.unban(this.user.id, 'softban');
        const id = await Database.instance.addModeration(this.guild.guild.id, this.user.id, 'softban', reason, null, moderator.id);
        await this.#logModeration(moderator, reason, id, 'softban');
    }

    /**
     * kick this user from this guild
     * @param {String}                              reason
     * @param {User|import('discord.js').ClientUser} moderator
     * @return {Promise<void>}
     */
    async kick(reason, moderator){
        await this.dmPunishedUser('kicked', reason, null, 'from');
        if (!this.member && await this.fetchMember() === null) return;
        await this.member.kick(this._shortenReason(`${moderator.tag} | ${reason}`));
        const id = await Database.instance.addModeration(this.guild.guild.id, this.user.id, 'kick', reason, null, moderator.id);
        await this.#logModeration(moderator, reason, id, 'kick');
    }

    /**
     * mute this user in this guild
     * @param {String}                              reason
     * @param {User|import('discord.js').ClientUser} moderator
     * @param {Number}                              [duration]
     * @return {Promise<void>}
     */
    async mute(reason, moderator, duration){
        const timeout = duration && duration <= TIMEOUT_LIMIT;
        let mutedRole;
        if (!timeout) {
            mutedRole = (await this._getGuildConfig()).mutedRole;
            if (!mutedRole) {
                return this.guild.log({content: 'Can\'t mute user because no muted role is specified'});
            }
        }
        await this.dmPunishedUser('muted', reason, duration, 'in');
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const shortedReason = this._shortenReason(`${moderator.tag} ${duration ? `(${formatTime(duration)}) ` : ''}| ${reason}`);
            if (timeout) {
                await this.member.timeout(duration*1000, shortedReason);
            } else {
                await this.member.roles.add(mutedRole, shortedReason);
            }
        }
        const id = await Database.instance.addModeration(this.guild.guild.id, this.user.id, 'mute', reason, duration, moderator.id);
        await this.#logModeration(moderator, reason, id, 'mute', formatTime(duration));
    }

    /**
     * unmute this user in this guild
     * @param {String}                              reason
     * @param {User|import('discord.js').ClientUser} moderator
     * @return {Promise<void>}
     */
    async unmute(reason, moderator){
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const {mutedRole} = await this._getGuildConfig();
            if(this.member.roles.cache.has(mutedRole)) {
                await this.member.roles.remove(mutedRole, this._shortenReason(`${moderator.tag} | ${reason}`));
            }
            await this.member.timeout(null);
        }
        await Database.instance.query(
            'UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = \'mute\'',
            this.guild.guild.id, this.user.id);
        const id = await Database.instance.addModeration(this.guild.guild.id, this.user.id, 'unmute', reason, null, moderator.id);
        await this.#logModeration(moderator, reason, id, 'unmute');
    }

    /**
     * is this member muted
     * @returns {Promise<boolean>}
     */
    async isMuted() {
        if (!this.member) await this.fetchMember(true);
        if (this.member.communicationDisabledUntilTimestamp) {
            return true;
        }

        const {mutedRole} = await this._getGuildConfig();
        if (this.member && this.member.roles.cache.get(mutedRole)) {
            return true;
        }

        return !!await Database.instance.query(
            'SELECT * FROM moderations WHERE active = TRUE AND action = \'mute\' AND guildid = ? AND userid = ?',
            this.guild.guild.id, this.user.id);
    }

    /**
     *
     * @param {import('discord.js').User} moderator
     * @param {string} reason
     * @param {number} id
     * @param {string} type
     * @param {?string} time
     * @param {?number} amount
     * @param {?number} total
     * @return {Promise<?Message>}
     */
    async #logModeration(moderator, reason, id, type, time = null, amount = null, total = null) {
        const embedColor = resolveColor(type);
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({
                name: `Case ${id} | ${toTitleCase(type)} | ${this.user.tag}`,
                iconURL: this.user.avatarURL()
            })
            .setFooter({text: this.user.id})
            .setTimestamp()
            .addFields(
                /** @type {any} */ { name: 'User', value: `<@${this.user.id}>`, inline: true},
                /** @type {any} */ { name: 'Moderator', value: `<@${moderator.id}>`, inline: true},
                /** @type {any} */ { name: 'Reason', value: reason.substring(0, 1024), inline: true}
            );
        if (time) {
            embed.addFields(/** @type {any} */ {name: 'Duration', value: time, inline: true});
        }
        if (amount) {
            embed.addFields(
                /** @type {any} */ {name: 'Amount', value: amount.toString(), inline: true},
                /** @type {any} */ {name: 'Total Strikes', value: total.toString(), inline: true},
            );
        }

        return this.guild.log({embeds: [embed]});
    }

    /**
     * send the user a dm about this punishment
     * @param {String}  verb
     * @param {String}  reason
     * @param {Number}  [duration]
     * @param {String}  [preposition] default: from
     * @return {Promise<Boolean>} success
     */
    async dmPunishedUser(verb, reason, duration, preposition = 'from') {
        return this.guild.sendDM(this.user,
            `You have been ${verb} ${preposition} \`${this.guild.guild.name}\` ${duration ? `for ${formatTime(duration)}` : ''} | ${reason}`
        );
    }

}
