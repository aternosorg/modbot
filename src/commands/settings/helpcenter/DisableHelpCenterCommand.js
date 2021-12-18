const SubCommand = require('../../SubCommand');

class DisableHelpCenterCommand extends SubCommand {
    static names = ['disable', 'off'];

    static description = 'Disable the help-center.';

    async execute() {
        this.guildConfig.helpcenter = null;
        await this.guildConfig.save();
        await this.reply('Disabled Zendesk help-center!');
    }
}

module.exports = DisableHelpCenterCommand;
