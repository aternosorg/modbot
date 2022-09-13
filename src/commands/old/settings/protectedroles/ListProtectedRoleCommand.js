const SubCommand = require('../../SubCommand.js');

class ListProtectedRoleCommand extends SubCommand {
    static description = 'List protected roles.';

    static names = ['list'];

    async execute() {
        await this.sendSuccess('Currently protected roles: ' + this.guildConfig.listProtectedRoles());
    }
}

module.exports = ListProtectedRoleCommand;
