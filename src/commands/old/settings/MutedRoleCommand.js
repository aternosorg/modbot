const ConfigCommand = require('../ConfigCommand.js');
const DisableMutedRoleCommand = require('./mutedrole/DisableMutedRoleCommand.js');
const GetMutedRoleCommand = require('./mutedrole/GetMutedRoleCommand.js');
const SetMutedRoleCommand = require('./mutedrole/SetMutedRoleCommand.js');

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
