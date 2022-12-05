import bot from '../bot/Bot.js';
import {
    ApplicationCommandPermissionType,
    ApplicationCommandType,
    hyperlink,
    PermissionFlagsBits,
    RESTJSONErrorCodes
} from 'discord.js';
import {AUTOCOMPLETE_OPTIONS_LIMIT} from '../util/apiLimits.js';
import Cache from '../bot/Cache.js';
import {formatTime} from '../util/timeutils.js';

import ArticleCommand from './external/ArticleCommand.js';
import AvatarCommand from './user/AvatarCommand.js';
import ExportCommand from './bot/ExportCommand.js';
import ImportCommand from './bot/ImportCommand.js';
import InfoCommand, {GITHUB_REPOSITORY} from './bot/InfoCommand.js';
import UserInfoCommand from './user/UserInfoCommand.js';
import MemberWrapper from '../discord/MemberWrapper.js';
import BanCommand from './user/BanCommand.js';
import UnbanCommand from './user/UnbanCommand.js';
import VideoCommand from './external/VideoCommand.js';
import KickCommand from './user/KickCommand.js';
import MuteCommand from './user/MuteCommand.js';
import UnmuteCommand from './user/UnmuteCommand.js';
import StrikeCommand from './user/StrikeCommand.js';
import PardonCommand from './user/PardonCommand.js';
import ModerationCommand from './moderation/ModerationCommand.js';
import SettingsCommand from './settings/SettingsCommand.js';
import LockCommand from './guild/LockCommand.js';
import UnlockCommand from './guild/UnlockCommand.js';
import PurgeCommand from './guild/PurgeCommand.js';
import SoftBanCommand from './user/SoftBanCommand.js';
import IDCommand from './guild/IDCommand.js';
import RoleInfoCommand from './guild/RoleInfoCommand.js';
import GuildInfoCommand from './guild/GuildInfoCommand.js';
import PurgeInvitesCommand from './guild/PurgeInvitesCommand.js';
import ErrorEmbed from '../embeds/ErrorEmbed.js';
import StrikePurgeCommand from './user/StrikePurgeCommand.js';
import {asyncFilter} from '../util/util.js';
import AutoResponseCommand from './settings/AutoResponseCommand.js';
import BadWordCommand from './settings/BadWordCommand.js';
import {replyOrFollowUp} from '../util/interaction.js';
import logger from '../bot/Logger.js';
import SafeSearchCommand from './settings/SafeSearchCommand.js';

const cooldowns = new Cache();

export class CommandManager {
    /**
     * @type {Command[]}
     */
    #commands = [
        // BOT
        new ExportCommand(),
        new ImportCommand(),
        new InfoCommand(),

        // EXTERNAL
        new ArticleCommand(),
        new VideoCommand(),

        // USER
        new AvatarCommand(),
        new UserInfoCommand(),
        new BanCommand(),
        new UnbanCommand(),
        new SoftBanCommand(),
        new KickCommand(),
        new MuteCommand(),
        new UnmuteCommand(),
        new StrikeCommand(),
        new PardonCommand(),
        new StrikePurgeCommand(),

        // MODERATION
        new ModerationCommand(),

        // SETTINGS
        new SettingsCommand(),
        new AutoResponseCommand(),
        new BadWordCommand(),
        new SafeSearchCommand(),

        // GUILD
        new LockCommand(),
        new UnlockCommand(),
        new PurgeCommand(),
        new IDCommand(),
        new RoleInfoCommand(),
        new GuildInfoCommand(),
        new PurgeInvitesCommand(),
    ];

    /**
     * @return {Command[]}
     */
    getCommands() {
        return this.#commands;
    }

    /**
     * register all slash commands
     * @return {Promise<void>}
     */
    async register() {
        const globalCommands = this.#commands.filter(command => command.isAvailableInAllGuilds());
        for (const [id, command] of await bot.client.application.commands.set(this.buildCommands(globalCommands))) {
            if (command.type === ApplicationCommandType.ChatInput) {
                this.findCommand(command.name).id = id;
            }
        }

        for (const guild of bot.client.guilds.cache.values()) {
            await this.updateCommandsForGuild(guild);
        }
    }

    async updateCommandsForGuild(guild) {
        const commands = this.buildCommands(await asyncFilter(
            this.#commands.filter(command => !command.isAvailableInAllGuilds()),
            (command, guild) => command.isAvailableIn(guild), guild
        ));

        try {
            await guild.commands.set(commands);
        }
        catch (e) {
            if (![RESTJSONErrorCodes.MissingPermissions, RESTJSONErrorCodes.MissingAccess].includes(e.code)) {
                await logger.error(`Failed to register commands in guild ${guild.id}`, e);
            }
        }
    }

    /**
     *
     * @param {Command[]} commands
     * @return {import('discord.js').ApplicationCommandDataResolvable[]}
     */
    buildCommands(commands) {
        const result = [];
        for (const command of commands) {
            result.push(command.buildSlashCommand());
            if (command.supportsMessageCommands()) {
                result.push(command.buildMessageCommand());
            }
            if (command.supportsUserCommands()) {
                result.push(command.buildUserCommand());
            }
        }
        return result;
    }

    /**
     * find a command with this name
     * @param {string} name
     * @return {Command}
     */
    findCommand(name) {
        return this.getCommands().find(c => c.getName() === name.toLowerCase()) ?? null;
    }

    /**
     * check if this command can be executed in this context
     * @param {?ExecutableCommand} command
     * @param {import('discord.js').Interaction} interaction
     * @return {Promise<boolean>} is command executable
     */
    async checkCommandAvailability(command, interaction) {
        if (!command) {
            return false;
        }

        if (interaction.inGuild()) {
            const missingBotPermissions = interaction.appPermissions.missing(command.getRequiredBotPermissions());
            if (missingBotPermissions.length) {
                await interaction.reply(ErrorEmbed
                    .message(`I'm missing the following permissions to execute this command: ${missingBotPermissions}`));
                return false;
            }
        } else if (!command.isAvailableInDMs()) {
            return false;
        }

        if (command.getCoolDown()) {
            const key = `${interaction.user.id}:${command.getName()}`;
            const entry = cooldowns.getEntry(key);
            if (entry && !entry.isCacheTimeOver) {
                let remaining = entry.until - Date.now();
                remaining = Math.ceil(remaining / 1000);
                remaining = formatTime(remaining);

                await interaction.reply(ErrorEmbed.message(`You can use this command again in ${remaining}`));
                return false;
            }
            cooldowns.set(key, null, command.getCoolDown() * 1000);
        }
        return true;
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {Error|import('discord.js').DiscordAPIError} error
     * @return {Promise<void>}
     */
    async handleCommandError(interaction, error) {
        const name = [
            interaction.commandName ?? interaction.customId,
            interaction.options?.getSubcommandGroup(false),
            interaction.options?.getSubcommand(false)
        ].filter(v => !!v).join(' ');
        await logger.error(`Failed to execute command '${name}': ${error.name}`, error);
        let message = 'An error occurred while executing this command. ';
        if ([RESTJSONErrorCodes.MissingPermissions, RESTJSONErrorCodes.MissingAccess].includes(error.code)) {
            message = 'I\'m missing some permissions to execute this command. ';
        }

        message += `If this happens consistently please create an issue ${hyperlink('here', `${GITHUB_REPOSITORY}/issues`, 'GitHub Issues')}`;
        await replyOrFollowUp(interaction, ErrorEmbed.message(message));
    }

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @return {Promise<void>}
     */
    async execute(interaction) {
        const command = this.findCommand(interaction.commandName);
        if (!await this.checkCommandAvailability(command, interaction)) {
            return;
        }

        try {
            await command.execute(interaction);
        }
        catch (e) {
            await this.handleCommandError(interaction, e);
        }
    }

    /**
     * @param {import('discord.js').AutocompleteInteraction} interaction
     * @return {Promise<void>}
     */
    async autocomplete(interaction) {
        const command = this.findCommand(interaction.commandName);
        if (!command) {
            return;
        }

        try {
            const options = await command.complete(interaction);
            await interaction.respond(options.slice(0, AUTOCOMPLETE_OPTIONS_LIMIT));
        }
        catch (e) {
            const name = [
                interaction.commandName,
                interaction.options.getSubcommandGroup(false),
                interaction.options.getSubcommand(false)
            ].filter(v => !!v).join(' ');
            e.commandOptions = interaction.options.data;
            await logger.error(`Failed to autocomplete command '${name}': ${e.name}`, e);
        }
    }

    /**
     * @param {import('discord.js').UserContextMenuCommandInteraction} interaction
     * @return {Promise<void>}
     */
    async executeUserMenu(interaction) {
        const command = this.findCommand(interaction.commandName);
        if (!await this.checkCommandAvailability(command, interaction)) {
            return;
        }

        try {
            await command.executeUserMenu(interaction);
        }
        catch (e) {
            await this.handleCommandError(interaction, e);
        }
    }

    /**
     * @param {import('discord.js').MessageContextMenuCommandInteraction} interaction
     * @return {Promise<void>}
     */
    async executeMessageMenu(interaction) {
        const command = this.findCommand(interaction.commandName);
        if (!await this.checkCommandAvailability(command, interaction)) {
            return;
        }

        try {
            await command.executeMessageMenu(interaction);
        }
        catch (e) {
            await this.handleCommandError(interaction, e);
        }
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     * @return {Promise<void>}
     */
    async executeButton(interaction) {
        if (!interaction.customId) {
            return;
        }

        const command = this.findCommand(interaction.customId.split(':')[0]);
        if (!await this.checkCommandAvailability(command, interaction)) {
            return;
        }

        if (!command.isAvailableInDMs() && !await this.checkMemberPermissions(interaction, command)) {
            return;
        }

        try {
            await command.executeButton(interaction);
        }
        catch (e) {
            await this.handleCommandError(interaction, e);
        }
    }

    /**
     * @param {import('discord.js').ModalSubmitInteraction} interaction
     * @return {Promise<void>}
     */
    async executeModal(interaction) {
        const command = this.findCommandByCustomId(interaction.customId);
        if (!await this.checkCommandAvailability(command, interaction)) {
            return;
        }

        if (!command.isAvailableInDMs() && !await this.checkMemberPermissions(interaction, command)) {
            return;
        }

        try {
            await command.executeModal(interaction);
        }
        catch (e) {
            await this.handleCommandError(interaction, e);
        }
    }

    /**
     * @param {import('discord.js').AnySelectMenuInteraction} interaction
     * @return {Promise<void>}
     */
    async executeSelectMenu(interaction) {
        const command = this.findCommandByCustomId(interaction.customId);
        if (!await this.checkCommandAvailability(command, interaction)) {
            return;
        }

        if (!command.isAvailableInDMs() && !await this.checkMemberPermissions(interaction, command)) {
            return;
        }

        try {
            await command.executeSelectMenu(interaction);
        }
        catch (e) {
            await this.handleCommandError(interaction, e);
        }
    }

    /**
     * @param {?string} id
     * @return {?Command}
     */
    findCommandByCustomId(id) {
        if (!id) {
            return null;
        }

        return this.findCommand(id.split(':')[0]);
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {Command} command
     * @return {Promise<boolean>}
     */
    async checkMemberPermissions(interaction, command) {
        const permission = await this.hasPermission(interaction, command);
        if (!permission) {
            await interaction.reply(ErrorEmbed.message('You\'re not allowed to execute this command!'));
        }
        return permission;
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {Command} command
     * @return {Promise<boolean>}
     */
    async hasPermission(interaction, command) {
        const member = await (new MemberWrapper(interaction.user, interaction.guild)).fetchMember();

        if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return true;
        }

        if (!interaction.memberPermissions.has(PermissionFlagsBits.UseApplicationCommands)) {
            return false;
        }

        // Check permissions for specific command if they exist
        const commandPermissions = await this.fetchCommandOverrides(interaction.guild, command.id);
        if (commandPermissions.length) {
            return this.hasPermissionInOverrides(member, interaction.channel, commandPermissions);
        }

        // Fallback to global permissions if they exist
        const globalPermissions = await this.fetchCommandOverrides(interaction.guild, bot.client.user.id);
        if (globalPermissions.length) {
            return this.hasPermissionInOverrides(member, interaction.channel, globalPermissions);
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
     *
     * @param {import('discord.js').GuildMember} member
     * @param {import('discord.js').GuildTextBasedChannel} channel
     * @param {import('discord.js').ApplicationCommandPermissions[]} overrides
     * @return {Promise<?boolean>}
     */
    async hasPermissionInOverrides(member, channel, overrides) {
        let permission = null;
        // https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-constants
        const everyoneRoleId = member.guild.id;
        const allChannelsId = (BigInt(member.guild.id) - 1n).toString();

        const everyoneOverride = overrides.find(override =>
            override.type === ApplicationCommandPermissionType.Role
            && override.id === everyoneRoleId
        ) ?? null;

        const roleOverrides = overrides.filter(override =>
            override.type === ApplicationCommandPermissionType.Role
            && override.id !== everyoneRoleId
            && member.roles.resolve(override.id)
        );

        const memberOverride = overrides.find(override =>
            override.type === ApplicationCommandPermissionType.User
            && override.id === member.id
        );

        const globalChannelOverride = overrides.find(override =>
            override.type === ApplicationCommandPermissionType.Channel
            && override.id === allChannelsId
        ) ?? null;

        const channelOverride = overrides.find(override =>
            override.type === ApplicationCommandPermissionType.Channel
            && override.id === channel.id
        ) ?? null;

        // check channel permissions
        if (channelOverride && !channelOverride.permission) {
            return false;
        }
        if (!channelOverride && globalChannelOverride && !globalChannelOverride.permission) {
            return false;
        }

        // Apply permissions for the default role (@everyone).
        if (everyoneOverride) {
            permission = everyoneOverride.permission;
        }

        // Apply denies for all additional roles the guild member has at once.
        if (roleOverrides.some(override => !override.permission)) {
            permission = false;
        }

        // Apply allows for all additional roles the guild member has at once.
        if (roleOverrides.some(override => override.permission)) {
            permission = true;
        }

        // Apply permissions for the specific guild member if they exist.
        if (memberOverride) {
            permission = memberOverride.permission;
        }

        return permission;
    }

    /**
     *
     * @param {import('discord.js').Guild} guild
     * @param {import('discord.js').Snowflake} commandId
     * @return {Promise<import('discord.js').ApplicationCommandPermissions[]>}
     */
    async fetchCommandOverrides(guild, commandId) {
        try {
            return await guild.commands.permissions.fetch({command: commandId});
        }
        catch (e) {
            if (e.code === RESTJSONErrorCodes.UnknownApplicationCommandPermissions) {
                return [];
            } else {
                throw e;
            }
        }
    }
}

export default new CommandManager();
