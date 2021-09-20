const CommandManager = require('../../CommandManager');
const Database = require('../../Database');
const {Client, CommandInteraction, Constants: {APIErrors}} = require('discord.js');
const Command = require('../../Command');
const monitor = require('../../Monitor').getInstance();
const CommandSource = require('../../CommandSource');

module.exports = {
    /**
     * @param {Object} options
     * @param {Database} options.database
     * @param {Client} options.bot
     * @param {CommandInteraction} interaction
     * @return {Promise<void>}
     */
    async event(options, interaction) {
        if (!interaction.isCommand() && !interaction.isContextMenu())
            return;

        const name = interaction.commandName;
        const CommandClass = CommandManager.getCommands().get(name);
        if (CommandClass === undefined) return;

        try {
            /** @type {Command} */
            const cmd = new CommandClass(new CommandSource(interaction), options.database, options.bot, name, '/');
            await cmd._loadConfigs();
            const userPerms = cmd.userHasPerms(), botPerms = cmd.botHasPerms();
            if (userPerms !== true) {
                await interaction.reply({
                    content: `You are missing the following permissions to execute this command: ${userPerms.join(', ')}`,
                    ephemeral: true,
                });
                return;
            }
            if (botPerms !== true) {
                await interaction.reply({
                    content: `I am missing the following permissions to execute this command: ${botPerms.join(', ')}`,
                    ephemeral: true,
                });
                return;
            }
            await cmd.execute();
        } catch (e) {
            if  (e.code === APIErrors.MISSING_PERMISSIONS) {
                await interaction.reply({
                    content: 'I am missing permissions to execute that command!',
                    ephemeral: true,
                });
            }
            else {
                await interaction.reply({
                    content: 'An error occurred while executing that command!',
                    ephemeral: true,
                });
            }
            await monitor.error(`Failed to execute command ${name}`, e);
            console.error(`An error occurred while executing command ${name}:`,e);
        }
    }
};