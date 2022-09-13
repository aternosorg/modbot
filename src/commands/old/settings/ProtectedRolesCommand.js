const ConfigCommand = require('../ConfigCommand.js');
const AddProtectedRoleCommand = require('./protectedroles/AddProtectedRoleCommand.js');
const ListProtectedRoleCommand = require('./protectedroles/ListProtectedRoleCommand.js');
const RemoveProtectedRoleCommand = require('./protectedroles/RemoveProtectedRoleCommand.js');

class ProtectedRolesCommand extends ConfigCommand {

    static description = 'Manage protected roles';

    static usage = 'add|list|remove';

    static names = ['protectedroles'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            AddProtectedRoleCommand,
            ListProtectedRoleCommand,
            RemoveProtectedRoleCommand,
        ];
    }
}

module.exports = ProtectedRolesCommand;
