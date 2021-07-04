const config = require('../config.json');
const Config = require('./Config');
const Discord = require('discord.js');
const {MessageEmbed} = require('discord.js');

/**
 * Class representing the config of a guild
 */
class GuildConfig extends Config {

    static tableName = 'guilds';

    #punishments = {};
    #modRoles = [];
    #protectedRoles = [];
    prefix = config.prefix;

    /**
     * Constructor - create a guild config
     *
     * @param  {Snowflake}                        id                        guild id
     * @param  {Object}                           [json]                    options
     * @param  {Snowflake}                        [json.logChannel]         id of the log channel
     * @param  {Snowflake}                        [json.messageLogChannel]  if of the message log channel
     * @param  {Snowflake}                        [json.mutedRole]          id of the muted role
     * @param  {Snowflake[]}                      [json.modRoles]           role ids that can execute commands
     * @param  {Snowflake[]}                      [json.protectedRoles]     role ids that can't be targeted by moderations
     * @param  {Object}                           [json.punishments]        automatic punishments for strikes
     * @param  {String}                           [json.playlist]           id of youtube playlist for tutorials
     * @param  {String}                           [json.helpcenter]         subdomain of the zendesk help center
     * @param  {Boolean}                          [json.invites]            allow invites (can be overwritten per channel)
     * @param  {Number}                           [json.linkCooldown]       cooldown on links in s (user based)
     * @param  {String}                           [json.prefix]             alternative prefix for commands
     * @param  {Number}                           [json.maxMentions]        maximum amount of mentions allowed
     * @param  {Boolean}                          [json.caps]               should caps be automatically deleted
     * @param  {Boolean}                          [json.raidMode]           is anti-raid-mode enabled
     * @param  {Number}                           [json.antiSpam]           should message spam detection be enabled
     * @param  {Number}                           [json.similarMessages]    should similar message detection be enabled
     * @return {GuildConfig}
     */
    constructor(id, json = {}) {
        super(id);

        this.logChannel = json.logChannel;
        this.messageLogChannel = json.messageLogChannel;
        this.mutedRole = json.mutedRole;
        if (json.modRoles instanceof Array)
            this.#modRoles = json.modRoles;
        if (json.protectedRoles instanceof Array)
            this.#protectedRoles = json.protectedRoles;
        if (json.punishments instanceof Object)
            this.#punishments = json.punishments;
        this.playlist = json.playlist;
        this.helpcenter = json.helpcenter;
        this.invites = json.invites ?? true;
        this.linkCooldown = json.linkCooldown || -1;
        if (typeof(json.prefix) === 'string')
            this.prefix = json.prefix;
        this.caps = json.caps || false;
        this.maxMentions = json.maxMentions || 5;
        this.raidMode = json.raidMode || false;
        this.antiSpam = typeof(json.antiSpam) === 'number' ? json.antiSpam : -1;
        this.similarMessages = json.similarMessages || -1;
    }

    /**
     * generate a settings embed
     * @returns {module:"discord.js".MessageEmbed}
     */
    getSettings() {
        const util = require('./util');
        return new MessageEmbed()
            .setTitle(`Settings | Prefix: ${this.prefix}`)
            .addField('Moderation', this.getModerationSettings(), false)
            .addField('Automod', this.getAutomodSettings(), false)
            .addField('Connections', this.getConnectionsSettings(), false)
            .setColor(util.color.red);
    }

    /**
     * generate an overview of moderation settings
     * @returns {string}
     */
    getModerationSettings() {
        return `Log: ${this.logChannel ? `<#${this.logChannel}>` : 'disabled'}\n` +
            `Message Log: ${this.messageLogChannel ? `<#${this.messageLogChannel}>` : 'disabled'}\n` +
            `Muted role: ${this.mutedRole ? `<@&${this.mutedRole}>` : 'disabled'}\n` +
            `Mod roles: ${this.listModRoles()}\n` +
            `Protected roles: ${this.listProtectedRoles()}\n`;
    }

    /**
     * generate an overview of connection settings
     * @returns {string}
     */
    getConnectionsSettings() {
        //How can youtube's link shortener *NOT* support playlists?
        return `Playlist: ${this.playlist ? `[${this.playlist}](https://www.youtube.com/playlist?list=${this.playlist})` : 'disabled'}\n` +
            `Helpcenter: ${this.helpcenter ? `https://${this.helpcenter}.zendesk.com/` : 'disabled'}\n`;
    }

    /**
     * generate an overview of automod settings
     * @returns {String}
     */
    getAutomodSettings() {
        const util = require('./util');
        return `Invites: ${this.invites ? 'allowed' : 'forbidden'}\n` +
            `Link cooldown: ${this.linkCooldown !== -1 ? util.secToTime(this.linkCooldown) : 'disabled'}\n` +
            `Caps: ${this.caps ? 'forbidden' : 'allowed'}\n` +
            `Max mentions: ${this.maxMentions === -1 ? 'disabled' : this.maxMentions}\n` +
            `Spam protection: ${this.antiSpam === -1 ? 'disabled' : `${this.antiSpam} messages per minute`}\n` +
            `Repeated message protection: ${this.similarMessages === -1 ? 'disabled' : `${this.similarMessages} similar messages per minute`}\n`;
    }

    /**
     * Is this a moderator role?
     * @param  {module:"discord.js".Snowflake} role role id
     * @return {Boolean}
     */
    isModRole(role) {
        return this.#modRoles.includes(role);
    }

    /**
     * Is this member a mod
     * @async
     * @param {module:"discord.js".GuildMember} member member object of the user in the specific guild
     * @return {Boolean}
     */
    isMod(member) {
        for (let [key] of member.roles.cache) {
            if (this.isModRole(/** @type {module:"discord.js".Snowflake} */ key))
                return true;
        }
        return false;
    }

    /**
     * Add this role to the moderator roles
     * @param  {module:"discord.js".Snowflake} role role id
     */
    addModRole(role) {
        this.#modRoles.push(role);
    }

    /**
     * Remove this role from the moderator roles
     * @param  {module:"discord.js".Snowflake} role role id
     */
    removeModRole(role) {
        const newRoles = [];
        for (let modRole of this.#modRoles) {
            if (modRole !== role)
                newRoles.push(modRole);
        }
        this.#modRoles = newRoles;
    }

    /**
     * list all modroles
     * @return {String}
     */
    listModRoles() {
        return this.#modRoles.map(role => `<@&${role}>`).join(', ') || 'none';
    }

    /**
     * Is this a protected role?
     * @param  {module:"discord.js".Snowflake} role role id
     * @return {Boolean}
     */
    isProtectedRole(role) {
        return this.#protectedRoles.includes(role);
    }

    /**
     * Is this member protected?
     * @async
     * @param {module:"discord.js".GuildMember} member member object of the user in the specific guild
     * @return {Boolean}
     */
    isProtected(member) {
        if (this.isMod(member)) return true;
        for (let [key] of member.roles.cache) {
            if (this.isProtectedRole(/** @type {module:"discord.js".Snowflake} */ key))
                return true;
        }
        return false;
    }

    /**
     * Add this role to the protected roles
     * @param  {module:"discord.js".Snowflake} role role id
     */
    addProtectedRole(role) {
        this.#protectedRoles.push(role);
    }

    /**
     * Remove this role from the protected roles
     * @param  {module:"discord.js".Snowflake} role role id
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
        return this.#punishments[strikes];
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
     * @param {Punishment|null} punishment
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
     * @return {module:"discord.js".Collection<Number, Punishment>}
     */
    getPunishments() {
        const punishments = new Discord.Collection();

        for (const key of Object.keys(this.#punishments)) {
            punishments.set(parseInt(key), this.#punishments[key]);
        }

        return punishments;
    }

    toJSONString() {
        //copy this to object
        const object = {};
        Object.assign(object,this);

        //delete id property because it is stored in a different column
        delete object.id;

        //copy private properties
        object.punishments = this.#punishments;
        object.modRoles = this.#modRoles;
        object.protectedRoles = this.#protectedRoles;

        //stringify
        return JSON.stringify(object);
    }
}

module.exports = GuildConfig;
