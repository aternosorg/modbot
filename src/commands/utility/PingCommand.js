const Command = require('../../Command');

class PingCommand extends Command {

    static description = 'Show the bot\'s ping';

    static names = ['ping'];

    async execute() {
        /** @type {module:"discord.js".Message} */
        const pong = await this.message.channel.send('Pinging...');
        await pong.edit(`Ping: ${pong.createdTimestamp-this.message.createdTimestamp}ms \nWebsocket: ${this.bot.ws.ping}ms\n*This is the bot's ping*`);
    }
}

module.exports = PingCommand;
