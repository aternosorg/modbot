const SubCommand = require('../../SubCommand.js');

class DisableMaxMentionsCommand extends SubCommand {
    static names = ['disable', 'off'];

    static description = 'Disable the mention limit.';

    async execute() {
        this.guildConfig.maxMentions = -1;
        await this.guildConfig.save();
        await this.reply('Disabled mention limit!');
    }
}

module.exports = DisableMaxMentionsCommand;
