const RoleSubCommand = require('../../RoleSubCommand.js');

class RemoveModRoleCommand extends RoleSubCommand {
    static description = 'Remove a moderator role.';

    static names = ['remove'];

    async addRole(role) {
        if (!this.guildConfig.isModRole(role.id)) {
            await this.sendError(`<@&${role.id}> is not a mod role!`);
            return;
        }

        this.guildConfig.removeModRole(role.id);
        await this.guildConfig.save();
        await this.sendSuccess(`Removed <@&${role.id}> from moderator roles.`);
    }

    static getOptions() {
        return [{
            name: 'role',
            type: 'ROLE',
            description: 'Moderator role',
            required: true,
        }];
    }
}

module.exports = RemoveModRoleCommand;
