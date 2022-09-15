import Bot from '../bot/Bot.js';
import {Routes} from 'discord.js';
import ArticleCommand from './utility/ArticleCommand.js';
import AvatarCommand from './utility/AvatarCommand.js';
import ExportCommand from './utility/ExportCommand.js';
import Cache from '../Cache.js';
import {formatTime} from '../util/timeutils.js';
import ImportCommand from './utility/ImportCommand.js';
import InfoCommand from './utility/InfoCommand.js';
import UserInfoCommand from './utility/UserInfoCommand.js';

const cooldowns = new Cache();

export default class CommandManager {
    static #instance;

    static get instance() {
        return this.#instance ??= new CommandManager();
    }

    /**
     * @return {Command[]}
     */
    getCommands() {
        return [
            new ArticleCommand(),
            new AvatarCommand(),
            new ExportCommand(),
            new ImportCommand(),
            new InfoCommand(),
            new UserInfoCommand(),
        ];
    }

    /**
     * register all slash commands
     * @return {Promise<void>}
     */
    async register() {
        const commands = [];
        for (const command of this.getCommands()) {
            commands.push(command.buildSlashCommand());
            if (command.supportsMessageCommands()) {
                commands.push(command.buildMessageCommand());
            }
            if (command.supportsUserCommands()) {
                commands.push(command.buildUserCommand());
            }
        }

        await Bot.instance.client.rest.put(Routes.applicationCommands(Bot.instance.client.user.id), { body: commands });
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @return {Promise<boolean>}
     */
    async execute(interaction) {
        const command = this.findCommand(interaction.commandName);
        if (!command) {
            return false;
        }

        if (!interaction.inGuild()) {
            if (!command.isAvailableInDMs()) {
                return false;
            }
        } else {
            const missingBotPermissions = interaction.appPermissions.missing(command.getRequiredBotPermissions());
            if (missingBotPermissions.length) {
                interaction.reply(`I'm missing the following permissions to execute this command: ${missingBotPermissions}`);
                return false;
            }
        }

        if (interaction.isContextMenuCommand() || interaction.isButton()) {
            interaction = await command.promptForOptions(interaction);

            if (!interaction) {
                return false;
            }
        }

        if (command.getCoolDown()) {
            const key = `${interaction.user.id}:${command.getName()}`;
            const entry = cooldowns.getEntry(key);
            if (entry && !entry.isCacheTimeOver) {
                let remaining = entry.until - Date.now();
                remaining = Math.ceil(remaining / 1000);
                remaining = formatTime(remaining);

                await interaction.reply({
                    ephemeral: true,
                    content: `You can use this command again in ${remaining}`,
                });
                return false;
            }

            cooldowns.set(key, null, command.getCoolDown() * 1000);
        }

        await command.execute(interaction);
        return true;
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

        await interaction.respond(await command.complete(interaction));
    }

    /**
     * find a command with this name
     * @param {string} name
     * @return {Command}
     */
    findCommand(name) {
        return this.getCommands().find(c => c.getName() === name.toLowerCase()) ?? null;
    }
}