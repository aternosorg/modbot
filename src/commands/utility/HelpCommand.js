const Command = require('../../Command');
const {MessageEmbed} = require('discord.js');
const util = require('../../util');

class HelpCommand extends Command {

    static description = 'View command information';

    static usage = '[<category|command>]';

    static names = ['help'];

    async execute() {

        const commandManager = require('../../features/messageCreate/CommandManager');

        const categories = commandManager.getCategories();
        const commands = commandManager.getCommands();

        if (!this.args.length) {
            const embed = new MessageEmbed()
                .setColor(util.color.red)
                .setFooter(`View a command or category using ${this.prefix}help <category|command>`);
            for (const [key, commands] of categories.entries()) {
                if (commands.length === 0) continue;
                embed.addField(util.toTitleCase(key), commands.map(c => c.names).flat().sort().join(', '));
            }
            return this.message.channel.send(embed);
        }

        const name = this.args.shift().toLowerCase();
        const category = categories.get(name);
        const command = commands.get(name);
        if (!category && !command) return this.sendUsage();

        if (category) {
            let description = '';

            for (const command of category) {
                description += command.getOverview() + '\n';
            }

            return this.message.channel.send(new MessageEmbed()
                .setTitle(`ModBot ${util.toTitleCase(name)} Commands:`)
                .setColor(util.color.red)
                .setDescription(description)
                .setFooter(`View a command using ${this.prefix}help <command>`)
            );
        }

        if (command) return this.message.channel.send(await command.getUsage(this.message, name, this.guildConfig));
    }
}

module.exports = HelpCommand;
