import {ApplicationCommandType, ContextMenuCommandBuilder, SlashCommandBuilder} from 'discord.js';
import SubCommandGroup from './SubCommandGroup.js';
import SubCommand from './SubCommand.js';
import ExecutableCommand from './ExecutableCommand.js';

/**
 * @abstract
 */
export default class Command extends ExecutableCommand {

    /**
     * add options to slash command builder
     * @param {import('discord.js').SlashCommandBuilder} builder
     * @return {import('discord.js').SlashCommandBuilder}
     */
    buildOptions(builder) {
        return super.buildOptions(builder);
    }

    /**
     * @return {SubCommand|SubCommandGroup[]}
     */
    getChildren() {
        return [];
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
            .setDefaultMemberPermissions(this.getRequiredUserPermissions().bitfield)
            .setDMPermission(this.isAvailableInDMs());

        if (this.getChildren().length) {
            for (const child of this.getChildren()) {
                if (child instanceof SubCommandGroup) {
                    builder.addSubcommandGroup(child.buildSubCommandGroup);
                }
                else if (child instanceof SubCommand) {
                    builder.addSubcommand(child.buildSubCommand);
                }
            }
        }
        else {
            this.buildOptions(builder);
        }

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
            .setName(this.getName())
            .setType(ApplicationCommandType.User)
            .setDefaultMemberPermissions(this.getRequiredUserPermissions())
            .setDMPermission(this.isAvailableInDMs());
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
            .setName(this.getName())
            .setType(ApplicationCommandType.Message)
            .setDefaultMemberPermissions(this.getRequiredUserPermissions())
            .setDMPermission(this.isAvailableInDMs());
    }
}