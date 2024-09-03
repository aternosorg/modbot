import {ApplicationCommandType, ContextMenuCommandBuilder, SlashCommandBuilder} from 'discord.js';
import ExecutableCommand from './ExecutableCommand.js';
import {toTitleCase} from '../util/format.js';

/**
 * @abstract
 */
export default class Command extends ExecutableCommand {

    /**
     * discord slash command id
     * @type {import('discord.js').Snowflake}
     */
    id = '';

    /**
     * Permissions that members need to execute this command by default.
     * Null: no permissions required. Empty bitfield: disabled by default
     *
     * For slash commands this is not checked by ModBot and is only used to register commands on Discord
     * For context menus, buttons and other interactions ModBot emulate Discord's permission system
     * @returns {?import('discord.js').PermissionsBitField}
     */
    getDefaultMemberPermissions() {
        return null;
    }

    /**
     * add options to slash command builder
     * @param {import('discord.js').SlashCommandBuilder} builder
     * @returns {import('discord.js').SlashCommandBuilder}
     */
    buildOptions(builder) {
        return super.buildOptions(builder);
    }

    /**
     * build this slash command
     * @returns {SlashCommandBuilder}
     */
    buildSlashCommand() {
        const builder = new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription(this.getDescription())
            .setDefaultMemberPermissions(this.getDefaultMemberPermissions()?.bitfield)
            .setDMPermission(this.isAvailableInDMs());

        this.buildOptions(builder);
        return builder;
    }

    /**
     * does this command support user context menus
     * @returns {boolean}
     */
    supportsUserCommands() {
        return false;
    }

    /**
     * build user context menu
     * @returns {ContextMenuCommandBuilder}
     */
    buildUserCommand() {
        return new ContextMenuCommandBuilder()
            .setName(toTitleCase(this.getName()))
            .setType(ApplicationCommandType.User)
            .setDefaultMemberPermissions(this.getDefaultMemberPermissions()?.bitfield)
            .setDMPermission(this.isAvailableInDMs());
    }

    /**
     * execute a user context menu
     * @param {import('discord.js').UserContextMenuCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async executeUserMenu(interaction) {

    }

    /**
     * does this command support message context menus
     * @returns {boolean}
     */
    supportsMessageCommands() {
        return false;
    }

    /**
     * build message context menu
     * @returns {ContextMenuCommandBuilder}
     */
    buildMessageCommand() {
        return new ContextMenuCommandBuilder()
            .setName(toTitleCase(this.getName()))
            .setType(ApplicationCommandType.Message)
            .setDefaultMemberPermissions(this.getDefaultMemberPermissions()?.bitfield)
            .setDMPermission(this.isAvailableInDMs());
    }

    /**
     * execute a message context menu
     * @param {import('discord.js').MessageContextMenuCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async executeMessageMenu(interaction) {

    }

    /**
     * is this command available in all guilds?
     * if not this command will manually be registered in all guilds where
     * @returns {boolean}
     */
    isAvailableInAllGuilds() {
        return true;
    }

    /**
     * is this command available in this guild?
     * @param {import('discord.js').Guild} guild
     * @returns {Promise<boolean>}
     */
    async isAvailableIn(guild) {
        return false;
    }
}