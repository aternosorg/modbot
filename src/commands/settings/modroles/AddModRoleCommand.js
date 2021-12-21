const SubCommand = require('../../SubCommand');
const Guild = require('../../../Guild');
const {Snowflake} = require('discord.js');
const util = require('../../../util');

class AddModRoleCommand extends SubCommand {
    static usage = '<@role|id>';

    static description = 'Add a moderator role.';

    static names = ['add'];

    async execute() {
        /** @type {Snowflake} */
        const roleID = this.source.isInteraction ? this.options.getRole('role')?.id : this.options.getString('roleID');
        const role = await (new Guild(this.source.getGuild())).fetchRole(roleID);

        if (!role) {
            await this.sendUsage();
            return;
        }

        if (this.guildConfig.isModRole(roleID)) {
            await this.sendSuccess(`<@&${roleID}> is already a mod role!`);
            return;
        }

        this.guildConfig.addModRole(roleID);
        await this.guildConfig.save();
        await this.sendSuccess(`Added <@&${roleID}> to moderator roles.`);
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
            value: util.roleMentionToId(args.shift()),
        }];
    }
}

module.exports = AddModRoleCommand;
