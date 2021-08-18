const fs = require('fs');
const defaultPrefix = require('../config.json').prefix;
const util = require('./util');
const GuildConfig = require('./config/GuildConfig');
const {Collection, Message} = require('discord.js');
const monitor = require('./Monitor').getInstance();
const Command = require('./Command');
const {CommandInfo} = require('./Typedefs');

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
