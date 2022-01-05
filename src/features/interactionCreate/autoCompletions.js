const CommandManager = require('../../commands/CommandManager');
const Database = require('../../Database');
const {Client, AutocompleteInteraction} = require('discord.js');
const monitor = require('../../Monitor').getInstance();
const CommandSource = require('../../commands/CommandSource');

module.exports = {
    /**
     * @param {Object} options
     * @param {Database} options.database
     * @param {Client} options.bot
     * @param {AutocompleteInteraction} interaction
     * @return {Promise<void>}
     */
    async event(options, interaction) {
        if (!interaction.isAutocomplete())
            return;

        const name = interaction.commandName;
        /** @type {typeof Command}*/
        const CommandClass = CommandManager.getCommands().get(name);
        if (CommandClass === undefined) {
            await interaction.respond([]);
            return;
        }

        if (CommandClass.guildOnly && !interaction.inGuild()) {
            await interaction.respond([]);
            return;
        }

        try {
            const cmd = new CommandClass(new CommandSource(interaction), options.database, options.bot, name, '/');

            if (interaction.inGuild()) {
                await cmd._loadConfigs();
            }

            await interaction.respond(await cmd.getAutoCompletions());
        } catch (e) {
            await monitor.error(`Failed to get auto completions for command ${name} option`, e);
            console.error(`An error occurred while getting auto completions for command ${name}:`,e);
        }
    }
};