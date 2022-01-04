const SubCommand = require('../../SubCommand');
const Guild = require('../../../Guild');
const {Snowflake} = require('discord.js');
const util = require('../../../util');

class AddProtectedRoleCommand extends SubCommand {
    static usage = '<@role|id>';

    static description = 'Add a protected role.';

    static names = ['add'];

    async execute() {
        /** @type {Snowflake} */
        const roleID = this.source.isInteraction ? this.options.getRole('role')?.id : this.options.getString('roleID');
        const role = await (new Guild(this.source.getGuild())).fetchRole(roleID);

        if (!role) {
            await this.sendUsage();
            return;
        }

        if (this.guildConfig.isProtectedRole(roleID)) {
            await this.sendSuccess(`<@&${roleID}> is already a protected role!`);
            return;
        }

        this.guildConfig.addProtectedRole(roleID);
        await this.guildConfig.save();
        await this.sendSuccess(`Added <@&${roleID}> to the protected roles.`);
    }

    static getOptions() {
        return [{
            name: 'role',
            type: 'ROLE',
            description: 'A role which should be invincible to moderations',
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

module.exports = AddProtectedRoleCommand;
