import SlashCommandPermissionManager from './SlashCommandPermissionManager.js';
import {PermissionFlagsBits} from 'discord.js';

/**
 * @import {Command} from '../commands/Command.js';
 * @import {SlashCommandPermissionOverrides} from './SlashCommandPermissionOverrides.js';
 */

export default class SlashCommandPermissionManagerV3 extends SlashCommandPermissionManager {
    /**
     * Check if the user has permission to execute the command.
     * This method uses the new V3 Permissions.
     * Reference: https://discord.com/developers/docs/change-log#upcoming-application-command-permission-changes
     * Flowchart: ![](https://media.discordapp.net/attachments/697138785317814292/1042878162901672048/flowchart-for-new-permissions.png)
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {Command} command
     * @returns {Promise<boolean>}
     */
    async hasPermission(interaction, command) {
        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return true;
        }

        const commandOverrides = await this.fetchOverrides(interaction, command.id);
        const appOverrides = await this.fetchOverrides(interaction);
        return this.hasCommandLevelChannelPermission(commandOverrides, appOverrides, interaction, command);
    }

    /**
     * Check if the user has permission to execute this command in context.
     * Check channel permissions for this command then fall back to other relevant checks.
     * Implements the upper block of "(1) Channel permissions" of the flowchart.
     * @param {SlashCommandPermissionOverrides} commandOverrides
     * @param {SlashCommandPermissionOverrides} appOverrides
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {Command} command
     * @returns {Promise<boolean>}
     */
    async hasCommandLevelChannelPermission(commandOverrides, appOverrides, interaction, command) {
        if (commandOverrides.channelOverride) {
            if (!commandOverrides.channelOverride.permission) {
                return false;
            }
            return this.hasCommandLevelUserRolePermission(commandOverrides, appOverrides, interaction, command);
        }
        else {
            if (!commandOverrides.allChannelsOverride) {
                return this.hasAppLevelChannelPermission(commandOverrides, appOverrides, interaction, command);
            }
            else {
                if (!commandOverrides.allChannelsOverride.permission) {
                    return false;
                }
                return this.hasCommandLevelUserRolePermission(commandOverrides, appOverrides, interaction, command);
            }
        }
    }

    /**
     * Check if the user has permission to execute this command in context.
     * Check channel permissions for the app then fall back to other relevant checks.
     * Implements the lower block of "(1) Channel permissions" of the flowchart.
     * @param {SlashCommandPermissionOverrides} commandOverrides
     * @param {SlashCommandPermissionOverrides} appOverrides
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {Command} command
     * @returns {Promise<boolean>}
     */
    async hasAppLevelChannelPermission(commandOverrides, appOverrides, interaction, command) {
        if (appOverrides.channelOverride) {
            if (!appOverrides.channelOverride.permission) {
                return false;
            }
            return this.hasCommandLevelUserRolePermission(commandOverrides, appOverrides, interaction, command);
        }
        else {
            if (appOverrides.allChannelsOverride && !appOverrides.allChannelsOverride.permission) {
                return false;
            }
            return this.hasCommandLevelUserRolePermission(commandOverrides, appOverrides, interaction, command);
        }
    }

    /**
     * Check if the user has permission to execute this command in context.
     * Check user/role permissions for this command then fall back to other relevant checks.
     * Implements the upper block of "(2) User/role permissions" of the flowchart.
     * @param {SlashCommandPermissionOverrides} commandOverrides
     * @param {SlashCommandPermissionOverrides} appOverrides
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {Command} command
     * @returns {Promise<boolean>}
     */
    async hasCommandLevelUserRolePermission(commandOverrides, appOverrides, interaction, command) {
        if (commandOverrides.memberOverride) {
            return commandOverrides.memberOverride.permission;
        }

        if (commandOverrides.memberRoleOverrides.length) {
            return commandOverrides.memberRoleOverrides.some(roleOverride => roleOverride.permission);
        }

        if (commandOverrides.everyoneOverride) {
            return commandOverrides.everyoneOverride.permission;
        }

        return this.hasAppLevelUserRolePermission(commandOverrides, appOverrides, interaction, command);
    }

    /**
     * Check if the user has permission to execute this command in context.
     * Check user/role permissions for this app then fall back to other relevant checks.
     * Implements the lower block of "(2) User/role permissions" of the flowchart.
     * @param {SlashCommandPermissionOverrides} commandOverrides
     * @param {SlashCommandPermissionOverrides} appOverrides
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {Command} command
     * @returns {Promise<boolean>}
     */
    async hasAppLevelUserRolePermission(commandOverrides, appOverrides, interaction, command) {
        if (appOverrides.memberOverride) {
            if (!appOverrides.memberOverride.permission) {
                return false;
            }
            return this.hasDefaultPermission(commandOverrides, appOverrides, interaction, command);
        }

        if (appOverrides.memberRoleOverrides.length) {
            if (!appOverrides.memberRoleOverrides.some(roleOverride => roleOverride.permission)) {
                return false;
            }
            return this.hasDefaultPermission(commandOverrides, appOverrides, interaction, command);
        }

        if (appOverrides.everyoneOverride) {
            if (!appOverrides.everyoneOverride.permission) {
                return false;
            }
            return this.hasDefaultPermission(commandOverrides, appOverrides, interaction, command);
        }

        return this.hasDefaultPermission(commandOverrides, appOverrides, interaction, command);
    }

    /**
     * Check if the user has permission to execute this command in context.
     * Check default permissions for this command.
     * Implements the block "(3) Default member permissions" of the flowchart.
     * @param {SlashCommandPermissionOverrides} commandOverrides
     * @param {SlashCommandPermissionOverrides} appOverrides
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {Command} command
     * @returns {Promise<boolean>}
     */
    async hasDefaultPermission(commandOverrides, appOverrides, interaction, command) {
        switch (command.getDefaultMemberPermissions()) {
            case null:
                return true;

            case 0:
                return false;

            default:
                return interaction.member.permissions.has(command.getDefaultMemberPermissions());
        }
    }
}