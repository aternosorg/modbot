const SubCommand = require('../../SubCommand');

class DisableSimilarMessages extends SubCommand {
    static names = ['disable', 'off'];

    static description = 'Disable repeated message protection.';

    async execute() {
        this.guildConfig.similarMessages = -1;
        await this.guildConfig.save();
        await this.reply('Disabled repeated message protection!');
    }
}

module.exports = DisableSimilarMessages;
