const config = require('../config.json');
const Config = require('./Config');
const Discord = require('discord.js');

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
     * @param  {module:"discord.js".Snowflake}    id                        guild id
     * @param  {Object}                           [json]                    options
     * @param  {module:"discord.js".Snowflake}    [json.logChannel]         id of the log channel
     * @param  {module:"discord.js".Snowflake}    [json.mutedRole]          id of the muted role
     * @param  {module:"discord.js".Snowflake[]}  [json.modRoles]           role ids that can execute commands
     * @param  {module:"discord.js".Snowflake[]}  [json.protectedRoles]     role ids that can't be targeted by moderations
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
        this.antiSpam = typeof(json.antiSpam) === "number" ? json.antiSpam : -1;
        this.similarMessages = json.similarMessages || -1;
    }

    /**
     * Is this a moderator role?
     *
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
     *
     * @param  {module:"discord.js".Snowflake} role role id
     */
    addModRole(role) {
        this.#modRoles.push(role);
    }

    /**
     * Remove this role from the moderator roles
     *
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
        let roles = '';
        for (let role of this.#modRoles) {
            roles += `<@&${role}>, `
        }
        return roles.length ? roles.substring(0, roles.length-2) : 'none';
    }

    /**
     * Is this a protected role?
     *
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
     *
     * @param  {module:"discord.js".Snowflake} role role id
     */
    addProtectedRole(role) {
        this.#protectedRoles.push(role);
    }

    /**
     * Remove this role from the protected roles
     *
     * @param  {module:"discord.js".Snowflake} role role id
     */
    removeProtectedRole(role) {
        let newRoles = [];
        for (let protectedRole of this.#protectedRoles) {
            if (protectedRole !== protectedRole)
                newRoles.push(protectedRole);
        }
        this.#protectedRoles = newRoles;
    }

    /**
     * list all protected roles
     * @return {String}
     */
    listProtectedRoles() {
        let roles = '';
        for (let role of this.#protectedRoles) {
            roles += `<@&${role}>, `
        }
        return roles.length ? roles.substring(0, roles.length-2) : 'none';
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
     * set a punishment
     * @param {Number} strikes
     * @param {Punishment|null} punishment
     * @return {Promise<>}
     */
    setPunishment(strikes, punishment) {
        if (punishment === null)
            delete this.#punishments[strikes]
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
            punishments.set(key, this.#punishments[key]);
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
