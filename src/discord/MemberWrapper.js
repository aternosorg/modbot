import GuildSettings from '../settings/GuildSettings.js';
import {EmbedBuilder, Guild, RESTJSONErrorCodes} from 'discord.js';
import {formatTime, parseTime} from '../util/timeutils.js';
import Database from '../bot/Database.js';
import GuildWrapper from './GuildWrapper.js';
import {resolveColor} from '../util/colors.js';
import {toTitleCase} from '../util/util.js';
import {TIMEOUT_LIMIT} from '../util/apiLimits.js';
import Moderation from '../database/Moderation.js';

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
     * get all moderations for this member
     * @return {Promise<Moderation[]>}
     */
    async getModerations() {
        return await Moderation.getAll(this.guild.guild.id, this.user.id);
    }

    /**
     * get the active moderation of this type
     * @param {string} type
     * @return {Promise<?Moderation>}
     */
    async getActiveModeration(type) {
        const moderation = await Database.instance.query(
            'SELECT * FROM moderations WHERE active = TRUE AND action = ? AND guildid = ? AND userid = ?',
            type, this.guild.guild.id, this.user.id);

        if (!moderation) {
            return null;
        }

        return new Moderation(moderation);
    }


    /**
     * get ban status, end timestamp and reason
     * @return {Promise<{banned: boolean, end: ?number, reason: string}>}
     */
    async getBanInfo() {
        const ban = await this.getActiveModeration('ban');
        if (ban) {
            return {
                banned: true,
                reason: ban.reason,
                end: ban.expireTime ? ban.expireTime * 1000 : null,
            };
        }

        const banInfo = await this.guild.fetchBan(this.user.id);
        if (banInfo) {
            return {
                banned: true,
                reason: banInfo.reason ?? 'Unknown',
                end: null,
            };
        }

        return {
            banned: false,
            reason: '',
            end: null
        };
    }

    /**
     * is this member banned
     * @returns {Promise<boolean>}
     */
    async isBanned() {
        return (await this.getBanInfo()).banned;
    }

    /**
     * get muted status, end timestamp and reason
     * @return {Promise<{muted: boolean, end: ?number, reason: string}>}
     */
    async getMuteInfo() {
        if (!this.member) await this.fetchMember(true);

        const mute = await this.getActiveModeration('mute');
        if (mute) {
            return {
                muted: true,
                reason: mute.reason,
                end: mute.expireTime ? mute.expireTime * 1000 : null,
            };
        }

        const until = this.member?.communicationDisabledUntilTimestamp;
        if (until && until > Date.now()) {
            return {
                muted: true,
                reason: 'Unknown (time-out)',
                end: until,
            };
        }

        const {mutedRole} = await this._getGuildConfig();
        if (mutedRole && this.member && this.member.roles.cache.get(mutedRole)) {
            return {
                muted: true,
                reason: 'Unknown (muted-role)',
                end: null
            };
        }

        return {
            muted: false,
            reason: '',
            end: null
        };
    }

    /**
     * is this member muted
     * @returns {Promise<boolean>}
     */
    async isMuted() {
        return (await this.getMuteInfo()).muted;
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
