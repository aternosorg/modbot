const GetConfigCommand = require('../../GetConfigCommand.js');

class GetSimilarMessages extends GetConfigCommand {
    static names = ['get','show'];

    async execute() {
        if (this.guildConfig.similarMessages === -1) {
            await this.reply('Repeated message protection is currently disabled');
        }
        else {
            await this.reply(`Repeated message protection is set to ${this.guildConfig.similarMessages} similar messages per minute.`);
        }
    }
}

module.exports = GetSimilarMessages;
