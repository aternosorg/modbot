const RoleSubCommand = require('../../RoleSubCommand');

class RemoveProtectedRoleCommand extends RoleSubCommand {
    static description = 'Remove a protected role.';

    static names = ['remove'];

    async addRole(role) {
        if (!this.guildConfig.isProtectedRole(role.id)) {
            await this.sendError(`<@&${role.id}> is not a protected role!`);
            return;
        }

        this.guildConfig.removeProtectedRole(role.id);
        await this.guildConfig.save();
        await this.sendSuccess(`Removed <@&${role.id}> from protected roles.`);
    }

    static getOptions() {
        return [{
            name: 'role',
            type: 'ROLE',
            description: 'Protected role',
            required: true,
        }];
    }
}

module.exports = RemoveProtectedRoleCommand;
