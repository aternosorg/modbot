const ConfigCommand = require('../ConfigCommand.js');
const GetInvitesCommand = require('./invites/GetInvitesCommand.js');
const SetInvitesCommand = require('./invites/SetInvitesCommand.js');

class InvitesCommand extends ConfigCommand {
    static description = 'Configure discord invite deletion';

    static usage = 'get|set';

    static names = ['invites'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            GetInvitesCommand,
            SetInvitesCommand
        ];
    }
}

module.exports = InvitesCommand;
