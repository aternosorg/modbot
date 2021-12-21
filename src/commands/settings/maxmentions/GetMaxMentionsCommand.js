const GetConfigCommand = require('../../GetConfigCommand');

class GetMaxMentionsCommand extends GetConfigCommand {
    async execute() {
        if (this.guildConfig.maxMentions === -1) {
            await this.reply('The mention limit is currently disabled.');
        }
        else {
            await this.reply(`Users can currently mention up to ${this.guildConfig.maxMentions} users in one message.`);
        }
    }
}

module.exports = GetMaxMentionsCommand;
