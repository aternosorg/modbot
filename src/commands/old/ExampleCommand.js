const Command = require('./OldCommand.js');

class ExampleCommand extends OldCommand {

    static description = 'describe the command';

    static usage = '<replace-this> [optional] abc|def';

    static names = ['example'];

    static comment = 'This is an example command';

    static userPerms = [];

    static botPerms = [];

    async execute() {
        await this.reply('This is an example: ' + this.options.getString('input', true));
    }

    static getOptions() {
        return [{
            name: 'input',
            type: 'STRING',
            description: 'An input string',
            required: true,
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'input',
                type: 'STRING',
                value: args.join(' '),
            }
        ];
    }
}

module.exports = ExampleCommand;
