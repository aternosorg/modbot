const Command = require('../Command');
const {Message} = require('discord.js');

class PingCommand extends Command {

    static description = 'Show the bot\'s ping';

    static names = ['ping'];

    static supportsSlashCommands = true;

    static guildOnly = false;

    async execute() {
        /** @type {Message} */
        await this.reply('Pinging...');
        await this.reply(`Latency: ${this.response.createdTimestamp-this.source.getRaw().createdTimestamp}ms \n`+
            `Websocket: ${this.bot.ws.ping}ms`
        );
    }
}

module.exports = PingCommand;
