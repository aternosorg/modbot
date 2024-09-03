import {RESTJSONErrorCodes} from 'discord.js';
import SlashCommandPermissionOverrides from './SlashCommandPermissionOverrides.js';
import bot from '../../bot/Bot.js';

/**
 * @import {Command} from '../commands/Command.js';
 */

/**
 * Emulate Discord Slash Command Permissions
 * @abstract
 */
export default class SlashCommandPermissionManager {

    /**
     * Calculates if a member has the permission to execute a command in a guild
     * Uses the older V2 Permission system: https://discord.com/developers/docs/change-log#updated-command-permissions
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {Command} command
     * @returns {Promise<boolean>}
     */
    async hasPermission(interaction, command) {
        throw new Error('Not implemented');
    }

    /**
     * fetch the overrides for a command or application
     * @param {import('discord.js').Interaction<"cached">} interaction
     * @param {import('discord.js').Snowflake} [commandId] leave empty to fetch global permissions
     * @returns {Promise<SlashCommandPermissionOverrides>}
     */
    async fetchOverrides(interaction, commandId = bot.client.user.id) {
        let overrides = [];
        try {
            overrides = await interaction.guild.commands.permissions.fetch({command: commandId});

        }
        catch (e) {
            if (e.code === RESTJSONErrorCodes.UnknownApplicationCommandPermissions) {
                overrides = [];
            } else {
                throw e;
            }
        }

        return new SlashCommandPermissionOverrides(overrides, interaction.guild, interaction.member, interaction.channel);
    }
}