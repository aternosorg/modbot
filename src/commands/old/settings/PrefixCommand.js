const Command = require('../OldCommand.js');
const Discord = require('discord.js');
const config = require('../../../../config.json');

class LogChannelCommand extends OldCommand {

    static description = 'Configure the guild specific bot prefix';

    static comment = `The default prefix (\`${config.prefix}\`) will always work`;

    static usage = 'status|set <prefix>';

    static names = ['prefix'];

    static userPerms = ['MANAGE_GUILD'];

    static supportsSlashCommands = false;

    async execute() {
        if (this.args.length === 0) {
            await this.sendUsage();
            return;
        }

        switch (this.args.shift().toLowerCase()) {
            case 'status':
                await this.reply(new Discord.MessageEmbed()
                    .setDescription(`The current guild prefix is \`${this.guildConfig.prefix}\`.`)
                );
                break;

            case 'set': {
                const prefix = this.args.shift()?.replace(/^ +/, '');

                if (!prefix) return this.sendUsage();
                if (prefix.length > 15) return this.reply('The prefix may not be longer than 15 characters');

                this.guildConfig.prefix = prefix;
                await this.guildConfig.save();

                await this.reply(new Discord.MessageEmbed()
                    .setDescription(`The guild prefix is now \`${prefix}\``)
                );
                break;
            }
            default:
                await this.sendUsage();
        }
    }
}

module.exports = LogChannelCommand;
