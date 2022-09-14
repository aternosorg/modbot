import Settings from './Settings.js';
import TypeChecker from './TypeChecker.js';
import {Collection, EmbedBuilder} from 'discord.js';
import Punishment from '../database/Punishment.js';
import Zendesk from '../Zendesk.js';
import colors from '../util/colors.js';
import {formatTime} from '../util/timeutils.js';

/**
 * @classdesc settings of a guild
 */
export default class GuildSettings extends Settings {

    static tableName = 'guilds';

    #punishments = {};
    #protectedRoles = [];

    /**
     * Constructor - create a guild settings
     *
     * @param  {import('discord.js').Snowflake}   id                        guild id
     * @param  {Object}                           [json]                    options
     * @param  {import('discord.js').Snowflake}   [json.logChannel]         id of the log channel
     * @param  {import('discord.js').Snowflake}   [json.messageLogChannel]  id of the message log channel
     * @param  {import('discord.js').Snowflake}   [json.joinLogChannel]     id of the join log channel
     * @param  {import('discord.js').Snowflake}   [json.mutedRole]          id of the muted role
     * @param  {import('discord.js').Snowflake[]} [json.modRoles]           role ids that can execute commands
     * @param  {import('discord.js').Snowflake[]} [json.protectedRoles]     role ids that can't be targeted by moderations
     * @param  {Object}                           [json.punishments]        automatic punishments for strikes
     * @param  {String}                           [json.playlist]           id of YouTube playlist for tutorials
     * @param  {String}                           [json.helpcenter]         subdomain of the zendesk help center
     * @param  {Boolean}                          [json.invites]            allow invites (can be overwritten per channel)
     * @param  {Number}                           [json.linkCooldown]       cooldown on links in s (user based)
     * @param  {Number}                           [json.maxMentions]        maximum amount of mentions allowed
     * @param  {Boolean}                          [json.caps]               should caps be automatically deleted
     * @param  {Boolean}                          [json.raidMode]           is anti-raid-mode enabled
     * @param  {Number}                           [json.antiSpam]           should message spam detection be enabled
     * @param  {Number}                           [json.similarMessages]    should similar message detection be enabled
     * @return {GuildSettings}
     */
    constructor(id, json = {}) {
        super(id);

        this.logChannel = json.logChannel;
        this.messageLogChannel = json.messageLogChannel;
        this.joinLogChannel = json.joinLogChannel;
        this.mutedRole = json.mutedRole;
        if (json.protectedRoles instanceof Array)
            this.#protectedRoles = json.protectedRoles;
        if (json.modRoles instanceof Array)
            this.#protectedRoles.push(...json.modRoles);
        if (json.punishments instanceof Object)
            this.#punishments = json.punishments;
        this.playlist = json.playlist;
        this.helpcenter = json.helpcenter;
        this.invites = json.invites ?? true;
        this.linkCooldown = json.linkCooldown || -1;
        this.caps = json.caps || false;
        this.maxMentions = json.maxMentions || 5;
        this.raidMode = json.raidMode || false;
        this.antiSpam = typeof(json.antiSpam) === 'number' ? json.antiSpam : -1;
        this.similarMessages = json.similarMessages || -1;
    }

    /**
     * check if the types of this object are a valid guild settings
     * @param {Object} json
     * @throws {TypeError} incorrect types
     */
    static checkTypes(json) {
        TypeChecker.assertOfTypes(json, ['object'], 'Data object');

        TypeChecker.assertStringUndefinedOrNull(json.logChannel, 'Log channel');
        TypeChecker.assertStringUndefinedOrNull(json.messageLogChannel, 'Message log channel');
        TypeChecker.assertStringUndefinedOrNull(json.mutedRole, 'Muted role');

        if (!(json.modRoles instanceof Array) || !json.modRoles.every(r => typeof r === 'string')) {
            throw new TypeError('Mod roles must be an array of strings!');
        }
        if (!(json.protectedRoles instanceof Array) || !json.protectedRoles.every(r => typeof r === 'string')) {
            throw new TypeError('Protected roles must be an array of strings!');
        }

        if (!(json.punishments instanceof Object) ||
            !Object.values(json.punishments).every(punishment => ['ban','kick','mute','softban','strike'].includes(punishment.action))) {
            throw new TypeError('Invalid punishments');
        }

        TypeChecker.assertStringUndefinedOrNull(json.playlist, 'Playlist');
        TypeChecker.assertStringUndefinedOrNull(json.helpcenter, 'Help center');
        TypeChecker.assertOfTypes(json.invites, ['boolean', 'undefined'], 'Invites');
        TypeChecker.assertNumberUndefinedOrNull(json.linkCooldown, 'Link cooldown');
        TypeChecker.assertNumberUndefinedOrNull(json.maxMentions, 'Max mentions');
        TypeChecker.assertNumberUndefinedOrNull(json.antiSpam, 'Anti Spam');
        TypeChecker.assertNumberUndefinedOrNull(json.similarMessages, 'Similar Messages');
    }

    /**
     * @param {String} id
     * @return {Promise<GuildSettings>}
     */
    static async get(id) {
        return super.get(id);
    }

    /**
     * generate a settings embed
     * @returns {EmbedBuilder}
     */
    getSettings() {
        return new EmbedBuilder()
            .setTitle('Settings')
            .addFields([
                {name: 'Moderation', value: this.getModerationSettings(), inline: false},
                {name: 'Automod', value: this.getAutomodSettings(), inline: false},
                {name: 'Connections', value: this.getConnectionsSettings(), inline: false}
            ])
            .setColor(colors.RED);
    }

    /**
     * generate an overview of moderation settings
     * @returns {string}
     */
    getModerationSettings() {
        return `Log: ${this.logChannel ? `<#${this.logChannel}>` : 'disabled'}\n` +
            `Message Log: ${this.messageLogChannel ? `<#${this.messageLogChannel}>` : 'disabled'}\n` +
            `Muted role: ${this.mutedRole ? `<@&${this.mutedRole}>` : 'disabled'}\n` +
            `Protected roles: ${this.listProtectedRoles()}\n`;
    }

    /**
     * generate an overview of connection settings
     * @returns {string}
     */
    getConnectionsSettings() {
        //How can YouTube's link shortener *NOT* support playlists?
        return `Playlist: ${this.playlist ? `[${this.playlist}](https://www.youtube.com/playlist?list=${this.playlist})` : 'disabled'}\n` +
            `Helpcenter: ${this.helpcenter ? `https://${this.helpcenter}.zendesk.com/` : 'disabled'}\n`;
    }

    /**
     * generate an overview of automod settings
     * @returns {String}
     */
    getAutomodSettings() {
        return `Invites: ${this.invites ? 'allowed' : 'forbidden'}\n` +
            `Link cooldown: ${this.linkCooldown !== -1 ? formatTime(this.linkCooldown) : 'disabled'}\n` +
            `Caps: ${this.caps ? 'forbidden' : 'allowed'}\n` +
            `Max mentions: ${this.maxMentions === -1 ? 'disabled' : this.maxMentions}\n` +
            `Spam protection: ${this.antiSpam === -1 ? 'disabled' : `${this.antiSpam} messages per minute`}\n` +
            `Repeated message protection: ${this.similarMessages === -1 ? 'disabled' : `${this.similarMessages} similar messages per minute`}\n`;
    }

    /**
     * Is this a protected role?
     * @param  {import('discord.js').Snowflake} role role id
     * @return {Boolean}
     */
    isProtectedRole(role) {
        return this.#protectedRoles.includes(role);
    }

    /**
     * Is this member protected?
     * @async
     * @param {import('discord.js').GuildMember} member member object of the user in the specific guild
     * @return {Boolean}
     */
    isProtected(member) {
        for (let [key] of member.roles.cache) {
            if (this.isProtectedRole(key))
                return true;
        }
        return false;
    }

    /**
     * Add this role to the protected roles
     * @param  {import('discord.js').Snowflake} role role id
     */
    addProtectedRole(role) {
        if (!this.isProtectedRole(role)) {
            this.#protectedRoles.push(role);
        }
    }

    /**
     * Remove this role from the protected roles
     * @param  {import('discord.js').Snowflake} role role id
     */
    removeProtectedRole(role) {
        let newRoles = [];
        for (let protectedRole of this.#protectedRoles) {
            if (protectedRole !== role)
                newRoles.push(role);
        }
        this.#protectedRoles = newRoles;
    }

    /**
     * list all protected roles
     * @return {String}
     */
    listProtectedRoles() {
        return this.#protectedRoles.map(role => `<@&${role}>`).join(', ') || 'none';
    }

    /**
     * get a specific punishment
     * @param {Number} strikes
     * @return {Punishment}
     */
    getPunishment(strikes) {
        return new Punishment(this.#punishments[strikes]);
    }

    /**
     * find the last punishment
     * @param {Number} strikes
     * @return {Punishment}
     */
    findPunishment(strikes) {
        let punishment;
        do {
            punishment = this.getPunishment(strikes);
            strikes --;
        } while (!punishment && strikes > 0);
        return punishment;
    }

    /**
     * set a punishment
     * @param {Number} strikes
     * @param {?Punishment} punishment
     * @return {Promise<>}
     */
    setPunishment(strikes, punishment) {
        if (punishment === null)
            delete this.#punishments[strikes];
        else
            this.#punishments[strikes] = punishment;
        return this.save();
    }

    /**
     * get all punishments
     * @return {Collection<Number, Punishment>}
     */
    getPunishments() {
        const punishments = new Collection();

        for (const key of Object.keys(this.#punishments)) {
            punishments.set(parseInt(key), this.#punishments[key]);
        }

        return punishments;
    }

    /**
     * get the zendesk instance for this guild
     * @return {Zendesk}
     */
    getZendesk() {
        if (!this.helpcenter) {
            return null;
        }

        return new Zendesk(this.helpcenter);
    }

    getDataObject(o = this) {
        //copy to new object
        const cleanObject = {};
        Object.assign(cleanObject, o);

        //copy private properties
        cleanObject.punishments = this.#punishments;
        cleanObject.protectedRoles = this.#protectedRoles;

        return super.getDataObject(cleanObject);
    }
}
