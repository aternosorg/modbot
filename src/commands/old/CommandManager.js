const fs = require('fs');
const config = require('../../../config.json');
const defaultPrefix = config.prefix;
const util = require('../../util.js');
const GuildConfig = require('../../config/GuildConfig.js');
const {Collection, Message} = require('discord.js');
const monitor = require('../Monitor').getInstance();
const Command = require('./OldCommand.js');
const {CommandInfo} = require('../../Typedefs.js');

class CommandManager {

    /**
     * command categories
     * @type {Collection<String, OldCommand[]>}
     */
    static #categories = new Collection();

    /**
     * array of all available command classes
     * @type {[]}
     */
    static commandClasses = [];

    /**
     * private commands
     * @type {OldCommand[]}
     */
    static privateCommands = [];

    /**
     * loaded commands (name => class)
     * @type {Collection<String, OldCommand>}
     * @private
     */
    static #commands = this._loadCommands();

    /**
     * load commands
     * @return {OldCommand[]}
     * @private
     */
    static _loadCommands() {
        const commands = new Collection();
        for (const folder of fs.readdirSync(__dirname)) {

            const category = [];

            const dirPath = `${__dirname}/${folder}`;
            if (!fs.lstatSync(dirPath).isDirectory()) continue;
            for (const file of fs.readdirSync(dirPath)) {
                const path = `${dirPath}/${file}`;
                if (!file.endsWith('.js') || !fs.lstatSync(path).isFile()) {
                    continue;
                }
                try {
                    const command = require(path);
                    if (command.private) {
                        this.privateCommands.push(command);
                    }

                    if (!command.private) {
                        category.push(command);
                    }
                    if (config.debug?.enabled && !command.supportsSlashCommands) {
                        console.debug(`./commands/${folder}/${file} doesn't support slash commands!`);
                    }

                    for (const name of command.names) {
                        if (commands.has(name)) {
                            console.error(`Two command registered the name '${name}':`);
                            console.error(`- ${commands.get(name).path}`);
                            console.error(`- ${folder}/${file}`);
                        }
                        command.path = `${folder}/${file}`;
                        commands.set(name, command);
                        if (!command.private) {
                            this.commandClasses.push(command);
                        }
                    }
                } catch (e) {
                    monitor.error(`Failed to load command '${folder}/${file}'`, e);
                    console.error(`Failed to load command '${folder}/${file}'`, e);
                }
            }

            if (category.length !== 0) {
                this.#categories.set(folder, category);
            }
        }
        return commands;
    }

    /**
     * get command categories
     * @return {Collection<String, OldCommand[]>}
     */
    static getCategories() {
        return this.#categories;
    }

    /**
     * get all commands (name => class)
     * @return {Collection<String, typeof OldCommand>}
     */
    static getCommands() {
        return this.#commands;
    }

    /**
     * get all command classes
     * @return {[]}
     */
    static getCommandClasses() {
        return this.commandClasses;
    }

    static getPrivateCommands() {
        return this.privateCommands;
    }

    /**
     * get the command in this message
     * @param {Message} message
     * @return {Promise<CommandInfo|null>}
     */
    static async getCommandName(message) {
        if (message.author.bot || !message.content) return {isCommand: false};
        const prefixes = [defaultPrefix.toLowerCase()];
        if (message.guild) {
            /** @type {GuildConfig} */
            const guild = await GuildConfig.get(/** @type {String} */ message.guild.id);
            prefixes.push(guild.prefix.toLowerCase());
        }
        const prefix = util.startsWithMultiple(message.content.toLowerCase(), ...prefixes);
        const args = util.split(message.content.substring(prefix.length),' ');
        if (!prefix || !args.length) return {isCommand: false};

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
