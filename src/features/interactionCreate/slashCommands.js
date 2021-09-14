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
                await interaction.reply(`You are missing the following permissions to execute this command: ${userPerms.join(', ')}`);
                return;
            }
            if (botPerms !== true) {
                await interaction.reply(`I am missing the following permissions to execute this command: ${botPerms.join(', ')}`);
                return;
            }
            await cmd.execute();
        } catch (e) {
            try {
                if  (e.code === APIErrors.MISSING_PERMISSIONS) {
                    await interaction.reply('I am missing permissions to execute that command!');
                }
                else {
                    await interaction.reply('An error occurred while executing that command!');
                }
            }
            catch (e2) {
                if (e2.code === APIErrors.MISSING_PERMISSIONS) {
                    return;
                }
            }
            await monitor.error(`Failed to execute command ${name}`, e);
            console.error(`An error occurred while executing command ${name}:`,e);
        }
    }
};