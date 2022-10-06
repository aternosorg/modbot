import GuildSettings from '../settings/GuildSettings.js';
import {Guild, RESTJSONErrorCodes} from 'discord.js';
import {formatTime, parseTime} from '../util/timeutils.js';
import Database from '../bot/Database.js';
import GuildWrapper from './GuildWrapper.js';
import {resolveColor} from '../util/colors.js';
import {toTitleCase} from '../util/util.js';
import {BAN_MESSAGE_DELETE_LIMIT, TIMEOUT_LIMIT} from '../util/apiLimits.js';
import Moderation from '../database/Moderation.js';
import UserWrapper from './UserWrapper.js';
import LineEmbed from '../embeds/LineEmbed.js';

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
     * get member from the custom id of a moderation
     * must follow the format 'action:id' or 'action:id:other-data'
     * @param {import('discord.js').Interaction} interaction
     * @param {number} position which position the user id is at. E.g. 2 for 'command:subcommand:id' or 3 for 'command:group:subcommand:id'
     * @return {Promise<?MemberWrapper>}
     */
    static async getMemberFromCustomId(interaction, position = 1) {
        const id = interaction.customId.split(':').at(position);
        const user = id ? await (new UserWrapper(id)).fetchUser() : null;
        if (!user) {
            await interaction.reply({ephemeral: true, content:'Unknown user!'});
            return null;
        }

        return new MemberWrapper(user, interaction.guild);
    }

    /**
     * fetch this member
     * @param {boolean} [force] bypass cache
     * @returns {Promise<?import('discord.js').GuildMember>}
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

        const {mutedRole} = await this.getGuildSettings();
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
     */
    async getGuildSettings() {
        return GuildSettings.get(this.guild.guild.id);
    }

    /**
     * is this member protected
     * @return {Promise<Boolean>}
     */
    async isProtected() {
        if (!await this.fetchMember()) {
            return false;
        }

        const guildSettings = await this.getGuildSettings();
        return guildSettings.isProtected(this.member);
    }

    /**
     * can the bot moderate this member
     * @return {Promise<boolean>}
     */
    async isModerateable() {
        return this.isModerateableBy(this.guild.guild.members.me);
    }

    /**
     * can this member be moderated by this moderator
     * @param {import('discord.js').GuildMember} moderator
     * @return {Promise<boolean>}
     */
    async isModerateableBy(moderator) {
        if (await this.isProtected()) {
            return false;
        }

        if (!this.member) {
            return true;
        }

        return moderator.roles.highest.comparePositionTo(this.member.roles.highest) > 0;
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
            this.executePunishment((await this.getGuildSettings()).findPunishment(total), `Reaching ${total} strikes`, true)
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
     * @param {?number}                              [duration]
     * @param {?number}                              [deleteMessageSeconds]
     * @return {Promise<void>}
     */
    async ban(reason, moderator, duration, deleteMessageSeconds){
        deleteMessageSeconds ??= 60 * 60;
        if (deleteMessageSeconds > BAN_MESSAGE_DELETE_LIMIT) {
            deleteMessageSeconds = BAN_MESSAGE_DELETE_LIMIT;
        }

        await this.dmPunishedUser('banned', reason, duration, 'from');
        await this.guild.guild.members.ban(this.user.id, {
            reason: this._shortenReason(`${moderator.tag} ${duration ? `(${formatTime(duration)}) ` : ''}| ${reason}`),
            deleteMessageSeconds,
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
     * @param {String}                                  reason
     * @param {import('discord.js').User}    moderator
     * @param {?number}                                 [deleteMessageSeconds]
     * @return {Promise<void>}
     */
    async softban(reason, moderator, deleteMessageSeconds){
        deleteMessageSeconds ??= 60 * 60;
        if (deleteMessageSeconds > BAN_MESSAGE_DELETE_LIMIT) {
            deleteMessageSeconds = BAN_MESSAGE_DELETE_LIMIT;
        }

        await this.dmPunishedUser('softbanned', reason, null, 'from');
        await this.guild.guild.members.ban(this.user.id, {
            deleteMessageSeconds,
            reason: this._shortenReason(`${moderator.tag} | ${reason}`)
        });
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
            mutedRole = (await this.getGuildSettings()).mutedRole;
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
            const {mutedRole} = await this.getGuildSettings();
            if (this.member.roles.cache.has(mutedRole)) {
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
        return this.guild.log({
            embeds: [
                new LineEmbed()
                    .setColor(resolveColor(type))
                    .setAuthor({
                        name: `Case ${id} | ${toTitleCase(type)} | ${this.user.tag}`,
                        iconURL: this.user.avatarURL()
                    })
                    .setFooter({text: this.user.id})
                    .addLine('User', `<@${this.user.id}>`)
                    .addLine('Moderator', `<@${moderator.id}>`)
                    .addLineIf(time, 'Duration', time)
                    .addLineIf(amount, 'Amount', amount)
                    .addLineIf(amount, 'Total Strikes', total)
                    .addLine('Reason', reason.substring(0, 1024))
            ]
        });
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
            `You have been ${verb} ${preposition} \`${this.guild.guild.name}\` ${duration ? `for ${formatTime(duration)}` : ''}: ${reason}`
        );
    }

}
