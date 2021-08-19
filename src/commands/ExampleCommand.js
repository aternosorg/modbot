const Command = require('../Command');

class ExampleCommand extends Command {

    static description = 'describe the command';

    static usage = '<replace-this> [optional] abc|def';

    static names = ['example'];

    static comment = 'This is an example command';

    static userPerms = [];

    static botPerms = [];

    static supportsSlashCommands = true;

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

    parseOptions() {
        return [
            {
                name: 'input',
                type: 'STRING',
                value: this.args.join(' '),
            }
        ];
    }
}

module.exports = ExampleCommand;
