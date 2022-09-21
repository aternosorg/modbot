import {ApplicationCommandType, ContextMenuCommandBuilder, SlashCommandBuilder} from 'discord.js';
import ExecutableCommand from './ExecutableCommand.js';
import {toTitleCase} from '../util/util.js';

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
     * add options to slash command builder
     * @param {import('discord.js').SlashCommandBuilder} builder
     * @return {import('discord.js').SlashCommandBuilder}
     */
    buildOptions(builder) {
        return super.buildOptions(builder);
    }

    /**
     * is this command available in direct messages
     * @return {boolean}
     */
    isAvailableInDMs() {
        return false;
    }

    /**
     * build this slash command
     * @return {SlashCommandBuilder}
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
     * @return {boolean}
     */
    supportsUserCommands() {
        return false;
    }

    /**
     * build user context menu
     * @return {ContextMenuCommandBuilder}
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
     * @return {Promise<void>}
     */
    async executeUserMenu(interaction) {

    }

    /**
     * does this command support message context menus
     * @return {boolean}
     */
    supportsMessageCommands() {
        return false;
    }

    /**
     * build message context menu
     * @return {ContextMenuCommandBuilder}
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
     * @return {Promise<void>}
     */
    async executeMessageMenu(interaction) {

    }
}