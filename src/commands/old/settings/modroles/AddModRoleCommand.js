const RoleSubCommand = require('../../RoleSubCommand.js');

class AddModRoleCommand extends RoleSubCommand {
    static description = 'Add a moderator role.';

    static names = ['add'];

    async addRole(role) {
        if (this.guildConfig.isModRole(role.id)) {
            await this.sendSuccess(`<@&${role.id}> is already a mod role!`);
            return;
        }

        this.guildConfig.addModRole(role.id);
        await this.guildConfig.save();
        await this.sendSuccess(`Added <@&${role.id}> to moderator roles.`);
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

module.exports = AddModRoleCommand;
