const ConfigCommand = require('../ConfigCommand');
const DisableMutedRoleCommand = require('./mutedrole/DisableMutedRoleCommand');
const GetMutedRoleCommand = require('./mutedrole/GetMutedRoleCommand');
const SetMutedRoleCommand = require('./mutedrole/SetMutedRoleCommand');

class LogChannelCommand extends ConfigCommand {

    static description = 'Manage the muted role';

    static usage = 'get|set|disable';

    static names = ['mutedrole','muterole'];

    static userPerms = ['MANAGE_GUILD'];

    static botPerms = ['MANAGE_CHANNELS', 'MANAGE_ROLES'];

    static getSubCommands() {
        return [
            DisableMutedRoleCommand,
            GetMutedRoleCommand,
            SetMutedRoleCommand
        ];
    }
}

module.exports = LogChannelCommand;
