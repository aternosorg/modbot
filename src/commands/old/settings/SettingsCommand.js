const Command = require('../OldCommand.js');

class ExampleCommand extends OldCommand {

    static description = 'View server settings';

    static names = ['settings', 'options'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        await this.reply(this.guildConfig.getSettings());
    }
}

module.exports = ExampleCommand;
