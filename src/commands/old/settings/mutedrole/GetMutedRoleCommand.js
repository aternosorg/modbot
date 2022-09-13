const GetConfigCommand = require('../../GetConfigCommand.js');

class GetMutedRoleCommand extends GetConfigCommand {
    static names = ['get','status'];

    async execute() {
        const roleid = this.guildConfig.mutedRole;
        if (roleid) {
            await this.sendSuccess(`The current muted role is <@&${roleid}>.`);
        }
        else {
            await this.sendError('There is no muted role set up.');
        }
    }
}

module.exports = GetMutedRoleCommand;
