const Command = require('../../Command');
const {Message} = require('discord.js');

class PingCommand extends Command {

    static description = 'Show the bot\'s ping';

    static names = ['ping'];

    static supportsSlashCommands = true;

    async execute() {
        /** @type {Message} */
        await this.reply('Pinging...');
        await this.response.edit(`Ping: ${this.response.createdTimestamp-this.message.createdTimestamp}ms \n`+
            `Websocket: ${this.bot.ws.ping}ms\n`+
            '*This is the bot\'s ping*'
        );
    }
}

module.exports = PingCommand;
