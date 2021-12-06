const Command = require('../Command');

class ExampleCommand extends Command {

    static description = 'View server settings';

    static names = ['settings', 'options'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        await this.reply(this.guildConfig.getSettings());
    }
}

module.exports = ExampleCommand;
