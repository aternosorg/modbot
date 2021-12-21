const SubCommand = require('../../SubCommand');
const Guild = require('../../../Guild');
const {Snowflake} = require('discord.js');

class RemoveModRoleCommand extends SubCommand {
    static usage = '<@role|id>';

    static description = 'Remove a moderator role.';

    static names = ['remove'];

    async execute() {
        /** @type {Snowflake} */
        const roleID = this.source.isInteraction ? this.options.getRole('role')?.id : this.options.getString('roleID');
        const role = await (new Guild(this.source.getGuild())).fetchRole(roleID);

        if (!role) {
            await this.sendUsage();
            return;
        }

        if (!this.guildConfig.isModRole(roleID)) {
            await this.sendError(`<@&${roleID}> is not a mod role!`);
            return;
        }

        this.guildConfig.removeModRole(roleID);
        await this.guildConfig.save();
        await this.sendSuccess(`Removed <@&${roleID}> from moderator roles.`);
    }

    static getOptions() {
        return [{
            name: 'role',
            type: 'ROLE',
            description: 'Moderator role',
            required: true,
        }];
    }

    parseOptions(args) {
        return [{
            name: 'roleID',
            type: 'STRING',
            value: args.shift(),
        }];
    }
}

module.exports = RemoveModRoleCommand;
