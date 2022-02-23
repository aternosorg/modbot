const SubCommand = require('../../SubCommand');
const Guild = require('../../../Guild');
const {Snowflake, Role} = require('discord.js');
const util = require('../../../util');

/**
 * @class
 * @classdesc command that takes a role as an argument
 *
 */
class RoleSubCommand extends SubCommand {
    static usage = '<@role|id>';

    async execute() {
        /** @type {Snowflake} */
        const roleID = this.source.isInteraction ? this.options.getRole('role')?.id : this.options.getString('roleID');
        if (!roleID) {
            await this.sendUsage();
            return;
        }
        const role = await (new Guild(this.source.getGuild())).fetchRole(roleID);

        if (!role) {
            await this.sendUsage();
            return;
        }

        await this.addRole(role);
    }

    /**
     * @abstract
     * @param {Role} role
     * @return {Promise<void>}
     */
    // eslint-disable-next-line no-unused-vars
    async addRole(role) {

    }

    static getOptions() {
        return [{
            name: 'role',
            type: 'ROLE',
            description: 'role',
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

module.exports = RoleSubCommand;
