const config = require('../config.json');
const Config = require('./Config');

/**
 * Class representing the config of a guild
 */
class GuildConfig extends Config {

    static tableName = 'guilds';

    punishments = {};
    #modRoles = [];
    #protectedRoles = [];
    prefix = config.prefix;

    /**
     * Constructor - create a guild config
     *
     * @param  {module:"discord.js".Snowflake}    id                    guild id
     * @param  {Object}                           [json]                options
     * @param  {module:"discord.js".Snowflake}    [json.logChannel]     id of the log channel
     * @param  {module:"discord.js".Snowflake}    [json.mutedRole]      id of the muted role
     * @param  {module:"discord.js".Snowflake[]}  [json.modRoles]       role ids that can execute commands
     * @param  {module:"discord.js".Snowflake[]}  [json.protecedRoles]  role ids that can't be targeted by moderations
     * @param  {Object}                           [json.punishments]    automatic punishments for strikes
     * @param  {String}                           [json.playlist]       id of youtube playlist for tutorials
     * @param  {String}                           [json.helpcenter]     subdomain of the zendesk help center
     * @param  {Boolean}                          [json.invites]        allow invites (can be overwritten per channel)
     * @param  {Number}                           [json.linkCooldown]   cooldown on links in s (user based)
     * @param  {String}                           [json.prefix]         alternative prefix for commands
     * @param  {Boolean}                          [json.capsMod]        should caps be automatically deleted
     * @return {GuildConfig}
     */
    constructor(id, json) {
        super(id);

        if (json) {
          this.logChannel = json.logChannel;
          this.mutedRole = json.mutedRole;
          this.#modRoles = json.modRoles;
          this.#protectedRoles = json.protecedRoles;
          this.punishments = json.punishments;
          this.playlist = json.playlist;
          this.helpcenter = json.helpcenter;
          this.invites = json.invites;
          this.linkCooldown = json.linkCooldown;
          this.prefix = json.prefix;
          this.capsMod = json.capsMod || false;
        }
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
}

module.exports = GuildConfig;
