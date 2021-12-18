const GetConfigCommand = require('../../GetConfigCommand');

class GetHelpCenterCommand extends GetConfigCommand {
    static names = ['get','show'];

    async execute() {
        if (!this.guildConfig.helpcenter) {
            await this.reply('There is no help-center configured');
        }
        else {
            await this.reply(`Active help-center: https://${this.guildConfig.helpcenter}.zendesk.com`);
        }
    }
}

module.exports = GetHelpCenterCommand;
