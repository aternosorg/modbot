const Command = require('../../Command');

class ExampleCommand extends Command {

    static names = ['example'];

    async execute() {
        await this.message.channel.send("This is an example");
    }
}

module.exports = ExampleCommand;
