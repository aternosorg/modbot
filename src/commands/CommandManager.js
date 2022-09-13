import Bot from '../bot/Bot.js';
import {Routes} from 'discord.js';
import ArticleCommand from './utility/ArticleCommand.js';

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
     * @param {import('discord.js').BaseInteraction} interaction
     * @return {Promise<boolean>}
     */
    async execute(interaction) {
        const command = this.getCommands().find(c => c.getName() === interaction.commandName);
        if (!command) {
            return false;
        }

        if (!interaction.inGuild()) {
            if (!command.isAvailableInDMs()) {
                return false;
            }
        } else {
            const missingUserPermissions = interaction.memberPermissions.missing(command.getRequiredUserPermissions());
            if (missingUserPermissions.length) {
                interaction.reply(`You're missing the following permissions to execute this command: ${missingUserPermissions}`);
                return false;
            }

            const missingBotPermissions = interaction.appPermissions.missing(command.getRequiredBotPermissions());
            if (missingBotPermissions.length) {
                interaction.reply(`I'm missing the following permissions to execute this command: ${missingBotPermissions}`);
                return false;
            }
        }

        if (interaction.isAutocomplete()) {
            await this.autocomplete(/** @type {import('discord.js').AutocompleteInteraction} */ interaction, command);
            return true;
        }

        await command.execute(interaction);
        return true;
    }

    /**
     * @param {import('discord.js').AutocompleteInteraction} interaction
     * @param {Command} command
     * @return {Promise<void>}
     */
    async autocomplete(interaction, command) {
        await interaction.respond(await command.complete(interaction));
    }
}