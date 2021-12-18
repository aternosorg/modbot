const ConfigCommand = require('../ConfigCommand');
const GetInvitesCommand = require('./invites/GetInvitesCommand');
const SetInvitesCommand = require('./invites/SetInvitesCommand');

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
