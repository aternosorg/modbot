import {ApplicationCommandPermissionType} from 'discord.js';

export default class SlashCommandPermissionOverrides {
    /**
     * @type {import('discord.js').ApplicationCommandPermissions[]}
     */
    #overrides = [];

    /**
     * @type {import('discord.js').Guild}
     */
    #guild;

    /**
     * @type {import('discord.js').GuildMember}
     */
    #member;

    /**
     * @type {import('discord.js').Channel}
     */
    #channel;

    /**
     *
     * @param {import('discord.js').ApplicationCommandPermissions[]} overrides
     * @param {import('discord.js').Guild} guild
     * @param {import('discord.js').GuildMember} member
     * @param {import('discord.js').Channel} channel
     */
    constructor(overrides, guild, member, channel) {
        this.#overrides = overrides;
        this.#guild = guild;
        this.#member = member;
        this.#channel = channel;
    }

    /**
     * get the raw overrides
     * @returns {import('discord.js').ApplicationCommandPermissions[]}
     */
    get rawOverrides() {
        return this.#overrides;
    }

    /**
     * get all role overrides
     * @returns {import('discord.js').ApplicationCommandPermissions[]}
     */
    get roleOverrides() {
        return this.#overrides.filter(override => override.type === ApplicationCommandPermissionType.Role);
    }

    /**
     * get the overrides for the @everyone role
     * @returns {?import('discord.js').ApplicationCommandPermissions}
     */
    get everyoneOverride() {
        return this.roleOverrides.find(override => override.id === this.#guild.id) ?? null;
    }

    /**
     * get the overrides for all roles this member has
     * @returns {import('discord.js').ApplicationCommandPermissions[]}
     */
    get memberRoleOverrides() {
        return this.roleOverrides.filter(override => this.#member.roles.resolve(override.id));
    }

    /**
     * get the overrides for all members
     * @returns {import('discord.js').ApplicationCommandPermissions[]}
     */
    get memberOverrides() {
        return this.#overrides.filter(override => override.type === ApplicationCommandPermissionType.User);
    }

    /**
     * get the override value for a single member
     * @returns {?import('discord.js').ApplicationCommandPermissions}
     */
    get memberOverride() {
        return this.memberOverrides.find(override => override.id === this.#member.id) ?? null;
    }

    /**
     * get the overrides for all channels
     * @returns {import('discord.js').ApplicationCommandPermissions[]}
     */
    get channelOverrides() {
        return this.#overrides.filter(override => override.type === ApplicationCommandPermissionType.Channel);
    }

    /**
     * get the default channel override value
     * @returns {?import('discord.js').ApplicationCommandPermissions}
     */
    get allChannelsOverride() {
        // https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-constants
        return this.channelOverrides.find(override => override.id === (BigInt(this.#guild.id) - 1n).toString()) ?? null;
    }

    /**
     * get the override value for a single channel
     * @returns {?import('discord.js').ApplicationCommandPermissions}
     */
    get channelOverride() {
        return this.channelOverrides.find(override => override.id === this.#channel.id) ?? null;
    }
}