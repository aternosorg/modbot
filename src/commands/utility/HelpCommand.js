const Command = require('../Command');
const {MessageEmbed, Collection} = require('discord.js');
const util = require('../../util');

class HelpCommand extends Command {

    static description = 'View command information';

    static usage = '[<category|command>]';

    static names = ['help'];

    static guildOnly = false;

    async execute() {
        const categories = this._getCategories(), commands = this._getCommands();

        const name = this.options.getString('command');
        const embed = new MessageEmbed().setColor(util.color.red);
        const data = {
            ephemeral: true,
            embeds: [embed]
        };

        if (!name) {
            //list all commands
            embed.setFooter({text: `View a command or category using ${this.prefix}help <category|command>`});
            for (const [key, commands] of categories.entries()) {
                embed.addField(util.toTitleCase(key), this._getNameList(commands));
            }
            return this.reply(data);
        }
        else if (categories.has(name)) {
            //show category overview
            let description = '';

            for (const command of categories.get(name)) {
                description += command.getOverview() + '\n';
            }

            embed
                .setTitle(`ModBot ${util.toTitleCase(name)} Commands:`)
                .setDescription(description)
                .setFooter({text: `View a command using ${this.prefix}help <command>`});

            return this.reply(data);
        }
        else if (commands.has(name)) {
            //send command usage
            data.embeds = [await commands.get(name).getUsage(this.source)];
            return this.reply(data);
        }
        else {
            //command not found -> send help usage
            return this.sendUsage();
        }
    }

    /**
     * get all categories and their commands
     * @return {Collection<String, Command[]>}
     * @private
     */
    _getCategories() {
        const commandManager = require('../CommandManager');
        return commandManager.getCategories();
    }

    /**
     * get all commands
     * @return {String[]}
     * @private
     */
    _getCommands() {
        const commandManager = require('../CommandManager');
        return commandManager.getCommands();
    }

    /**
     * list primary command names in alphabetical order
     * @param {[]} commands
     * @return {string}
     * @private
     */
    _getNameList(commands) {
        const names = [];
        for (const command of commands) {
            names.push(command.names[0]);
        }
        return names
            //.flat()
            .sort()
            .join(', ');
    }

    static getOptions() {
        return [{
            name: 'command',
            type: 'STRING',
            description: 'Category or command name',
            required: false,
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'command',
                type: 'STRING',
                value: args.shift()?.toLowerCase(),
            }
        ];
    }
}

module.exports = HelpCommand;
