const SubCommand = require('../../SubCommand.js');

class ListModRolesCommand extends SubCommand {
    static description = 'List moderator roles.';

    static names = ['list'];

    async execute() {
        await this.sendSuccess('Current mod roles: ' + this.guildConfig.listModRoles());
    }
}

module.exports = ListModRolesCommand;
