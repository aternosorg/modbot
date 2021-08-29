const Command = require('../../Command');
const {Message} = require('discord.js');

class PingCommand extends Command {

    static description = 'Show the bot\'s ping';

    static names = ['ping'];

    async execute() {
        /** @type {Message} */
        await this.reply('Pinging...');
        await this.response.edit(`Latency: ${this.response.createdTimestamp-this.message.createdTimestamp}ms \n`+
            `Websocket: ${this.bot.ws.ping}ms\n`+
        );
    }
}

module.exports = PingCommand;
