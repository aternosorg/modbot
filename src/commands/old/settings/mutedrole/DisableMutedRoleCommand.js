const SubCommand = require('../../SubCommand.js');

class DisableMutedRoleCommand extends SubCommand {
    static names = ['disable'];

    static description = 'Disable the muted role.';

    async execute() {
        this.guildConfig.mutedRole = null;
        await this.guildConfig.save();
        await this.sendSuccess('The muted role has been disabled.');
    }
}

module.exports = DisableMutedRoleCommand;
