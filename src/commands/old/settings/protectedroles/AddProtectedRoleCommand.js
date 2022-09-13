const RoleSubCommand = require('../../RoleSubCommand.js');

class AddProtectedRoleCommand extends RoleSubCommand {
    static description = 'Add a protected role.';

    static names = ['add'];

    async addRole(role) {
        if (this.guildConfig.isProtectedRole(role.id)) {
            await this.sendSuccess(`<@&${role.id}> is already a protected role!`);
            return;
        }

        this.guildConfig.addProtectedRole(role.id);
        await this.guildConfig.save();
        await this.sendSuccess(`Added <@&${role.id}> to the protected roles.`);
    }

    static getOptions() {
        return [{
            name: 'role',
            type: 'ROLE',
            description: 'A role which should be invincible to moderations',
            required: true,
        }];
    }
}

module.exports = AddProtectedRoleCommand;
