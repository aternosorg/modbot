const Command = require('../Command');

class ExampleCommand extends Command {

    static description = 'describe the command';

    static usage = '<replace-this> [optional] abc|def';

    static names = ['example'];

    static comment = 'This is an example command';

    static userPerms = [];

    static botPerms = [];

    async execute() {
        await this.reply('This is an example');
    }
}

module.exports = ExampleCommand;
