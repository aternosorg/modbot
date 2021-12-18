const ConfigCommand = require('../ConfigCommand');
const DisableHelpCenterCommand = require('./helpcenter/DisableHelpCenterCommand');
const GetHelpCenterCommand = require('./helpcenter/GetHelpCenterCommand');
const SetHelpCenterCommand = require('./helpcenter/SetHelpCenterCommand');

class HelpCenterCommand extends ConfigCommand {

    static names = ['helpcenter', 'zendesk'];

    static userPerms = ['MANAGE_GUILD'];

    static description = 'Configure the Zendesk help-center used in the article command.';

    static usage = 'get|set|disable';

    static getSubCommands() {
        return [
            DisableHelpCenterCommand,
            GetHelpCenterCommand,
            SetHelpCenterCommand
        ];
    }
}

module.exports = HelpCenterCommand;
