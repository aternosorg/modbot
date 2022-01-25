const CommandManager = require('../../commands/CommandManager');
const UserConfig = require('../../config/UserConfig');
const Database = require('../../Database');
const {Client, Message, Constants: {APIErrors}} = require('discord.js');
const Command = require('../../commands/Command');
const monitor = require('../../Monitor').getInstance();
const CommandSource = require('../../commands/CommandSource');
const config = require('../../../config.json');

module.exports = {
    /**
     * @param {Object} options
     * @param {Database} options.database
     * @param {Client} options.bot
     * @param {Message} message
     * @return {Promise<void>}
     */
    async event(options, message) {
        const {isCommand, name, prefix} = await CommandManager.getCommandName(message);
        const CommandClass = CommandManager.getCommands().get(name);
        if (!isCommand || CommandClass === undefined) return;

        if (CommandClass.guildOnly && !message.guild) {
            await message.reply('This command can only be used in a guild!');
            return;
        }

        try {
            /** @type {Command} */
            const cmd = new CommandClass(new CommandSource(message), options.database, options.bot, name, prefix);
            if (message.guild) {
                await cmd._loadConfigs();
                const userPerms = cmd.userHasPerms(), botPerms = cmd.botHasPerms();
                if (userPerms !== true) {
                    await message.reply(`You are missing the following permissions to execute this command: ${userPerms.join(', ')}`);
                    return;
                }
                if (botPerms !== true) {
                    await message.reply(`I am missing the following permissions to execute this command: ${botPerms.join(', ')}`);
                    return;
                }
            }

            await cmd.execute();
            const memberConfig = await UserConfig.get(message.author.id);
            if (message.guild && memberConfig.deleteCommands) {
                try {
                    await message.delete();
                }
                catch (e) {
                    if (e.code === APIErrors.UNKNOWN_MESSAGE) {
                        throw e;
                    }
                }
            }
        } catch (e) {
            try {
                if  (e.code === APIErrors.MISSING_PERMISSIONS) {
                    await message.reply('I am missing permissions to execute that command!');
                    if (config.debug.enabled) {
                        console.log('Missing permissions:', e);
                    }
                }
                else {
                    await message.reply('An error occurred while executing that command!');
                    throw e;
                }
            }
            catch (e2) {
                if (e2.code === APIErrors.MISSING_PERMISSIONS) {
                    return;
                }
                else {
                    await monitor.error(`Failed to execute command ${name}`, e);
                    console.error(`An error occurred while executing command ${name}:`,e);
                }
            }
        }
    }
};