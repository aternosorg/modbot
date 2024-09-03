import {PermissionFlagsBits} from 'discord.js';
import SlashCommandPermissionManager from './SlashCommandPermissionManager.js';

/**
 * @import {Command} from '../commands/Command.js';
 * @import {SlashCommandPermissionOverrides} from './SlashCommandPermissionOverrides.js';
 */

export default class SlashCommandPermissionManagerV2 extends SlashCommandPermissionManager {
    /**
     * Calculates if a member has the permission to execute a command in a guild
     * Uses the older V2 Permission system: https://discord.com/developers/docs/change-log#updated-command-permissions
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {Command} command
     * @returns {Promise<boolean>}
     */
    async hasPermission(interaction, command) {
        if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return true;
        }

        if (!interaction.memberPermissions.has(PermissionFlagsBits.UseApplicationCommands)) {
            return false;
        }

        // Check permissions for specific command if they exist
        const commandPermissions = await this.fetchOverrides(interaction, command.id);
        if (commandPermissions.rawOverrides.length) {
            return this.hasPermissionInOverrides(commandPermissions);
        }

        // Fallback to global permissions if they exist
        const globalPermissions = await this.fetchOverrides(interaction);
        if (globalPermissions.rawOverrides.length) {
            return this.hasPermissionInOverrides(globalPermissions);
        }

        // Fallback to default permissions
        switch (command.getDefaultMemberPermissions()) {
            case null:
                return true;
            case 0:
                return false;
            default:
                return interaction.memberPermissions.has(command.getDefaultMemberPermissions());
        }
    }

    /**
     * @param {SlashCommandPermissionOverrides} overrides
     * @returns {Promise<?boolean>}
     */
    async hasPermissionInOverrides(overrides) {
        let permission = null;

        // check channel permissions
        if (overrides.channelOverride) {
            if (!overrides.channelOverride.permission) {
                return false;
            }
        }
        else if (overrides.allChannelsOverride) {
            if (!overrides.allChannelsOverride.permission) {
                return false;
            }
        }

        // Apply permissions for the default role (@everyone).
        if (overrides.everyoneOverride) {
            permission = overrides.everyoneOverride.permission;
        }

        // Apply denies for all additional roles the guild member has at once.
        if (overrides.memberRoleOverrides.some(override => !override.permission)) {
            permission = false;
        }

        // Apply allows for all additional roles the guild member has at once.
        if (overrides.memberRoleOverrides.some(override => override.permission)) {
            permission = true;
        }

        // Apply permissions for the specific guild member if they exist.
        if (overrides.memberOverride) {
            permission = overrides.memberOverride.permission;
        }

        return permission;
    }
}