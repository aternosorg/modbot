const ConfigCommand = require('../ConfigCommand');
const AddProtectedRoleCommand = require('./protectedroles/AddProtectedRoleCommand');
const ListProtectedRoleCommand = require('./protectedroles/ListProtectedRoleCommand');
const RemoveProtectedRoleCommand = require('./protectedroles/RemoveProtectedRoleCommand');

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
