const ConfigCommand = require('../ConfigCommand.js');
const DisableHelpCenterCommand = require('./helpcenter/DisableHelpCenterCommand.js');
const GetHelpCenterCommand = require('./helpcenter/GetHelpCenterCommand.js');
const SetHelpCenterCommand = require('./helpcenter/SetHelpCenterCommand.js');

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
