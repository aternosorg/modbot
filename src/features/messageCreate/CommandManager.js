const fs = require('fs');
const defaultPrefix = require('../../../config.json').prefix;
const util = require('../../util');
const GuildConfig = require('../../config/GuildConfig');
const UserConfig = require('../../config/UserConfig');
const {Collection, Constants, Client, Message} = require('discord.js');
const {APIErrors} = Constants;
const monitor = require('../../Monitor').getInstance();
const Command = require('../../Command');
const Database = require('../../Database');
const {CommandInfo} = require('../../Typedefs');

class CommandManager {

    /**
     * command categories
     * @type {Collection<String, Command[]>}
     */
    static #categories = new Collection();

    /**
     * loaded commands (name => class)
     * @type {Collection<String, Command>}
     * @private
     */
    static #commands = this._loadCommands();

    /**
     * load commands
     * @return {Command[]}
     * @private
     */
    static _loadCommands() {
        const commands = new Collection();
        for (const folder of fs.readdirSync(`${__dirname}/../../commands`)) {

            const category = [];

            const dirPath = `${__dirname}/../../commands/${folder}`;
            if (!fs.lstatSync(dirPath).isDirectory()) continue;
            for (const file of fs.readdirSync(dirPath)) {
                const path = `${dirPath}/${file}`;
                if (!file.endsWith('.js') || !fs.lstatSync(path).isFile()) {
                    continue;
                }
                try {
                    const command = require(path);
                    category.push(command);
                    for (const name of command.names) {
                        if (commands.has(name)) {
                            console.error(`Two command registered the name '${name}':`);
                            console.error(`- ${commands.get(name).path}`);
                            console.error(`- ${folder}/${file}`);
                        }
                        command.path = `${folder}/${file}`;
                        commands.set(name, command);
                    }
                } catch (e) {
                    monitor.error(`Failed to load command '${folder}/${file}'`, e);
                    console.error(`Failed to load command '${folder}/${file}'`, e);
                }
            }

            this.#categories.set(folder, category);
        }
        return commands;
    }

    /**
     * get command categories
     * @return {Collection<String, Command[]>}
     */
    static getCategories() {
        return this.#categories;
    }

    /**
     * get all commands (name => class)
     * @return {Collection<String, Command>}
     */
    static getCommands() {
        return this.#commands;
    }

    /**
     *
     * @param {Object} options
     * @param {Database} options.database
     * @param {Client} options.bot
     * @param {Message} message
     * @return {Promise<void>}
     */
    static async event(options, message) {
        const {isCommand, name, prefix} = await this.getCommandName(message);
        const Command = this.#commands.get(name);
        if (!isCommand || Command === undefined) return;

        try {
            /** @type {Command} */
            const cmd = new Command(message, options.database, options.bot, name, prefix);
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
            await cmd.execute();
            const memberConfig = await UserConfig.get(message.author.id);
            if (memberConfig.deleteCommands) {
                try {
                    await message.delete();
                }
                catch (e) {
                    if (e.code !== APIErrors.UNKNOWN_MESSAGE) {
                        throw e;
                    }
                }
            }
        } catch (e) {
            try {
                if  (e.code === APIErrors.MISSING_PERMISSIONS) {
                    await message.reply('I am missing permissions to execute that command!');
                }
                else {
                    await message.reply('An error occurred while executing that command!');
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

    /**
     * get the command in this message
     * @param {Message} message
     * @return {Promise<CommandInfo|null>}
     */
    static async getCommandName(message) {
        if (!message.guild || message.author.bot) return {isCommand: false};
        /** @type {GuildConfig} */
        const guild = await GuildConfig.get(/** @type {String} */ message.guild.id);
        const prefix = util.startsWithMultiple(message.content.toLowerCase(), guild.prefix.toLowerCase(), defaultPrefix.toLowerCase());
        const args = util.split(message.content.substring(prefix.length),' ');
        if (!prefix) return {isCommand: false};

        return {
            isCommand: true,
            name: args[0].toLowerCase(),
            prefix,
            args
        };
    }

    /**
     * is this message a bot command
     * @param {Message} message
     * @return {Promise<boolean>}
     */
    static async isCommand(message) {
        const {isCommand, name} = await this.getCommandName(message);
        if (!isCommand) return false;
        return this.#commands.has(name);
    }
}

module.exports = CommandManager;
