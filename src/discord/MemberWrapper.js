import GuildSettings from '../settings/GuildSettings.js';
import {bold, Guild, RESTJSONErrorCodes} from 'discord.js';
import {formatTime, parseTime} from '../util/timeutils.js';
import database from '../bot/Database.js';
import GuildWrapper from './GuildWrapper.js';
import {BAN_MESSAGE_DELETE_LIMIT, TIMEOUT_LIMIT} from '../util/apiLimits.js';
import Moderation from '../database/Moderation.js';
import UserWrapper from './UserWrapper.js';
import ErrorEmbed from '../embeds/ErrorEmbed.js';

/**
 * @import {User} from 'discord.js';
 * @import {Punishment} from '../database/Punishment.js';
 */

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
     * @type {import('discord.js').GuildMember|null}
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
     * @returns {Promise<?MemberWrapper>}
     */
    static async getMemberFromCustomId(interaction, position = 1) {
        const id = interaction.customId.split(':').at(position);
        const user = id ? await (new UserWrapper(id)).fetchUser() : null;
        if (!user) {
            await interaction.reply(ErrorEmbed.message('Unknown user!'));
            return null;
        }

        return new MemberWrapper(user, interaction.guild);
    }

    /**
     * get member by guild and user id
     * @param {import('discord.js').Interaction} interaction
     * @param {import('discord.js').Snowflake} id user id
     * @returns {Promise<?MemberWrapper>}
     */
    static async getMember(interaction, id) {
        const user = await (new UserWrapper(id)).fetchUser();
        if (!user) {
            await interaction.reply(ErrorEmbed.message('Unknown user!'));
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
     * get the member or user object
     * @returns {Promise<import('discord.js').GuildMember|import('discord.js').User>}
     */
    async getMemberOrUser() {
        return this.member ?? await this.fetchMember() ?? this.user;
    }

    /**
     * get the display name of this member
     * @returns {Promise<string>}
     */
    async displayName() {
        return (await this.getMemberOrUser()).displayName;
    }

    /**
     * get the avatar url of this member
     * @returns {Promise<?string>}
     */
    async displayAvatarURL() {
        return (await this.getMemberOrUser()).displayAvatarURL();
    }

    /**
     * get all moderations for this member
     * @returns {Promise<Moderation[]>}
     */
    async getModerations() {
        return await Moderation.getAll(this.guild.guild.id, this.user.id);
    }

    /**
     * get the active moderation of this type
     * @param {string} type
     * @returns {Promise<?Moderation>}
     */
    async getActiveModeration(type) {
        const moderation = await database.query(
            'SELECT * FROM moderations WHERE active = TRUE AND action = ? AND guildid = ? AND userid = ?',
            type, this.guild.guild.id, this.user.id);

        if (!moderation) {
            return null;
        }

        return new Moderation(moderation);
    }


    /**
     * get ban status, end timestamp and reason
     * @returns {Promise<{banned: boolean, end: ?number, reason: string, comment: ?string}>}
     */
    async getBanInfo() {
        const ban = await this.getActiveModeration('ban');
        if (ban) {
            return {
                banned: true,
                reason: ban.reason,
                comment: ban.comment,
                end: ban.expireTime ? ban.expireTime * 1000 : null,
            };
        }

        const banInfo = await this.guild.fetchBan(this.user.id);
        if (banInfo) {
            return {
                banned: true,
                reason: banInfo.reason ?? 'Unknown',
                comment: null,
                end: null,
            };
        }

        return {
            banned: false,
            reason: '',
            comment: null,
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
     * @returns {Promise<{muted: boolean, end: ?number, reason: string, comment: ?string}>}
     */
    async getMuteInfo() {
        if (!this.member) await this.fetchMember(true);

        const mute = await this.getActiveModeration('mute');
        if (mute) {
            return {
                muted: true,
                reason: mute.reason,
                comment: mute.comment,
                end: mute.expireTime ? mute.expireTime * 1000 : null,
            };
        }

        if (this.member?.isCommunicationDisabled?.()) {
            return {
                muted: true,
                reason: 'Unknown (time-out)',
                comment: null,
                end: this.member.communicationDisabledUntilTimestamp,
            };
        }

        const mutedRole = await this.getMutedRole();
        if (mutedRole && this.member && this.member.roles.cache.get(mutedRole.id)) {
            return {
                muted: true,
                reason: 'Unknown (muted-role)',
                comment: null,
                end: null
            };
        }

        return {
            muted: false,
            reason: '',
            comment: null,
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
     * @returns {Promise<GuildSettings>}
     */
    async getGuildSettings() {
        return GuildSettings.get(this.guild.guild.id);
    }

    /**
     * fetch the muted role, return null if no muted role is set or the muted role doesn't exist.
     * @returns {Promise<import('discord.js').Role|null>}
     */
    async getMutedRole() {
        const settings = await this.getGuildSettings();
        if (!settings.getMutedRole()) {
            return null;
        }

        return await this.guild.fetchRole(settings.getMutedRole());
    }

    /**
     * is this member protected
     * @returns {Promise<boolean>}
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
     * @returns {Promise<boolean>}
     */
    async isModerateable() {
        return this.isModerateableBy(await this.guild.guild.members.fetchMe());
    }

    /**
     * can this member be moderated by this moderator
     * @param {import('discord.js').GuildMember} moderator
     * @returns {Promise<boolean>}
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
     * @returns {string}
     * @private
     */
    _shortenReason(reason) {
        return reason.substring(0, 500) + reason.length > 500 ? '...' : '';
    }

    /**
     * strike this member
     * @param {string}                               reason
     * @param {?string}                              comment
     * @param {User|import('discord.js').ClientUser} moderator
     * @param {number}                               amount
     * @returns {Promise<void>}
     */
    async strike(reason, comment, moderator, amount = 1){
        await this.dmPunishedUser('striked', reason, null, 'in');
        const moderation = await this.createModeration('strike', reason, comment, null, moderator.id, amount);
        const total = await this.getStrikeSum();
        await moderation.log(total);
        const punishment = (await this.getGuildSettings()).findPunishment(total);
        await this.executePunishment(punishment, `Reaching ${total} strikes`,  null, true);
    }

    /**
     * get the
     * @returns {Promise<number>}
     */
    async getStrikeSum() {
        return (await database.query(
            'SELECT SUM(value) AS sum FROM moderations WHERE guildid = ? AND userid = ? AND (action = \'strike\' OR action = \'pardon\')',
            this.guild.guild.id, this.user.id)
        )?.sum || 0;
    }

    /**
     * execute this punishment
     * @param {Punishment} punishment
     * @param {string} reason
     * @param {?string} comment
     * @param {boolean} [allowEmpty] return if there is no punishment instead of throwing an exception
     * @returns {Promise<void>}
     */
    async executePunishment(punishment, reason, comment, allowEmpty = false) {
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
                return this.ban(reason, comment, this.user.client.user, punishment.duration);

            case 'kick':
                return this.kick(reason, comment, this.user.client.user);

            case 'mute':
                return this.mute(reason, comment, this.user.client.user, punishment.duration);

            case 'softban':
                return this.softban(reason, comment, this.user.client.user);

            case 'strike':
                return this.strike(reason, comment, this.user.client.user);

            default:
                throw new Error(`Unknown punishment action ${punishment.action}`);
        }
    }

    /**
     * pardon strikes from this member
     * @param {string}                               reason
     * @param {?string}                              comment
     * @param {User|import('discord.js').ClientUser} moderator
     * @param {number}                               amount
     * @returns {Promise<void>}
     */
    async pardon(reason, comment, moderator, amount = 1){
        await this.guild.sendDM(this.user, `${amount} strikes have been pardoned in ${bold(this.guild.guild.name)} | ${reason}`);

        await (await this.createModeration('pardon', reason, comment, null, moderator.id, -amount)).log();
    }

    /**
     * ban this user from this guild
     * @param {string}                               reason
     * @param {?string}                              comment
     * @param {User|import('discord.js').ClientUser} moderator
     * @param {?number}                              [duration]
     * @param {?number}                              [deleteMessageSeconds]
     * @returns {Promise<void>}
     */
    async ban(reason, comment, moderator, duration, deleteMessageSeconds){
        deleteMessageSeconds ??= 60 * 60;
        if (deleteMessageSeconds > BAN_MESSAGE_DELETE_LIMIT) {
            deleteMessageSeconds = BAN_MESSAGE_DELETE_LIMIT;
        }

        await this.dmPunishedUser('banned', reason, duration, 'from');
        await this.guild.guild.members.ban(this.user.id, {
            reason: this._shortenReason(reason),
            deleteMessageSeconds,
        });
        await (await this.createModeration('ban', reason, comment, duration, moderator.id)).log();
    }

    /**
     * unban this member
     * @param {string}                               reason
     * @param {?string}                              comment
     * @param {User|import('discord.js').ClientUser} moderator
     * @returns {Promise<void>}
     */
    async unban(reason, comment, moderator){
        await this.disableActiveModerations('ban');
        try {
            await this.guild.guild.members.unban(this.user, this._shortenReason(reason));
        }
        catch (e) {
            if (e.code !== RESTJSONErrorCodes.UnknownBan) {
                throw e;
            }
        }
        await (await this.createModeration('unban', reason, comment, null, moderator.id)).log();
    }

    /**
     * softban this user from this guild
     * @param {string}                       reason
     * @param {?string}                      comment
     * @param {import('discord.js').User}    moderator
     * @param {?number}                      [deleteMessageSeconds]
     * @returns {Promise<void>}
     */
    async softban(reason, comment, moderator, deleteMessageSeconds){
        deleteMessageSeconds ??= 60 * 60;
        if (deleteMessageSeconds > BAN_MESSAGE_DELETE_LIMIT) {
            deleteMessageSeconds = BAN_MESSAGE_DELETE_LIMIT;
        }

        await this.dmPunishedUser('softbanned', reason, null, 'from');
        await this.guild.guild.members.ban(this.user.id, {
            deleteMessageSeconds,
            reason: this._shortenReason(reason)
        });
        await this.guild.guild.members.unban(this.user.id, 'softban');
        await (await this.createModeration('softban', reason, comment, null, moderator.id)).log();
    }

    /**
     * kick this user from this guild
     * @param {string}                               reason
     * @param {?string}                              comment
     * @param {User|import('discord.js').ClientUser} moderator
     * @returns {Promise<void>}
     */
    async kick(reason, comment, moderator){
        await this.dmPunishedUser('kicked', reason, null, 'from');
        if (!this.member && await this.fetchMember() === null) return;
        await this.member.kick(this._shortenReason(reason));
        await (await this.createModeration('kick', reason, comment, null, moderator.id)).log();
    }

    /**
     * mute this user in this guild
     * @param {string}                               reason
     * @param {?string}                              comment
     * @param {User|import('discord.js').ClientUser} moderator
     * @param {number}                               [duration]
     * @returns {Promise<void>}
     */
    async mute(reason, comment, moderator, duration){
        const timeout = duration && duration <= TIMEOUT_LIMIT;
        let mutedRole;
        if (!timeout) {
            mutedRole = await this.getMutedRole();
            if (!mutedRole) {
                await this.guild.log({content: 'Can\'t mute user because no valid muted role is specified'});
                return;
            }
        }
        await this.dmPunishedUser('muted', reason, duration, 'in');
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const shortedReason = this._shortenReason(reason);
            if (timeout) {
                await this.member.timeout(duration*1000, shortedReason);
            } else {
                await this.member.roles.add(mutedRole, shortedReason);
            }
        }
        await (await this.createModeration('mute', reason, comment, duration, moderator.id)).log();
    }

    /**
     * unmute this user in this guild
     * @param {string}                               reason
     * @param {?string}                              comment
     * @param {User|import('discord.js').ClientUser} moderator
     * @returns {Promise<void>}
     */
    async unmute(reason, comment, moderator){
        if (!this.member) await this.fetchMember();
        if (this.member) {
            const mutedRole = await this.getMutedRole();
            if (mutedRole && this.member.roles.cache.has(mutedRole.id)) {
                await this.member.roles.remove(mutedRole, this._shortenReason(reason));
            }
            await this.member.timeout(null);
        }
        await this.disableActiveModerations('mute');
        await (await this.createModeration('unmute', reason, comment, null, moderator.id)).log();
    }

    /**
     * create a new moderation and save it to the database
     * @param {string}                         action moderation type (e.g. 'ban')
     * @param {?string}                        reason reason for the moderation
     * @param {?string}                        comment internal comment for the moderation
     * @param {?number}                        duration duration of the moderation
     * @param {import('discord.js').Snowflake} moderatorId id of the moderator
     * @param {number} [value] value of the moderation (e.g. strike count)
     * @returns {Promise<Moderation>}
     */
    async createModeration(action, reason, comment, duration, moderatorId, value = 0) {
        await this.disableActiveModerations(action);

        const created = Math.floor(Date.now() / 1000);
        const moderation = new Moderation({
            guildid: this.guild.guild.id,
            userid: this.user.id,
            action,
            created,
            value,
            reason,
            comment,
            expireTime: duration ? created + duration : null,
            moderator: moderatorId,
            active: true,
        });

        await moderation.save();
        return moderation;
    }

    /**
     * disable all active moderations of a specific type
     * @param {string} type
     * @returns {Promise<void>}
     */
    async disableActiveModerations(type) {
        await database.query(
            'UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = ?',
            this.guild.guild.id, this.user.id, type);
    }

    /**
     * send the user a dm about this punishment
     * @param {string}  verb
     * @param {string}  reason
     * @param {?number}  [duration]
     * @param {string}  [preposition] default: from
     * @returns {Promise<boolean>} success
     */
    async dmPunishedUser(verb, reason, duration = null, preposition = 'from') {
        return this.guild.sendDM(this.user,
            `You have been ${verb} ${preposition} ${bold(this.guild.guild.name)}${duration ? ` for ${formatTime(duration)}` : ''}: ${reason}`
        );
    }

}
