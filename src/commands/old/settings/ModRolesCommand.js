const ConfigCommand = require('../ConfigCommand.js');
const AddModRoleCommand = require('./modroles/AddModRoleCommand.js');
const ListModRolesCommand = require('./modroles/ListModRolesCommand.js');
const RemoveModRoleCommand = require('./modroles/RemoveModRoleCommand.js');

class ModRolesCommand extends ConfigCommand {

    static description = 'Manage moderator roles. Moderators are able to use specific commands without other permissions.';

    static usage = 'add|remove|list';

    static names = ['modroles', 'modrole'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            AddModRoleCommand,
            ListModRolesCommand,
            RemoveModRoleCommand,
        ];
    }
}

module.exports = ModRolesCommand;
