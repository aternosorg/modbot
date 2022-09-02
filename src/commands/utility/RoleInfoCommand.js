const Command = require('../Command');
const Discord = require('discord.js');
const util = require('../../util');
const Guild = require('../../discord/GuildWrapper.js');
const DiscordGuild = Discord.Guild;
const {Snowflake} = Discord;

class RoleInfoCommand extends Command {

    static names = ['roleinfo', 'ri', 'role'];

    static usage = '<@role|id>';

    static description = 'Get information about a role';

    async execute() {
        let role;
        if (this.source.isInteraction) {
            role = this.options.getRole('role');
        } else {
            /** @type {Snowflake}*/
            const roleid = this.options.getString('roleID');
            if (!roleid) {
                return this.sendUsage();
            }
            const guild = new GuildWrapper(/** @type {DiscordGuild}*/this.source.getGuild());
            role = await guild.fetchRole(roleid);
        }

        if (!role) return this.sendUsage();

        let permissions;
        if (role.permissions.has('ADMINISTRATOR')) {
            permissions = 'Administrator';
        } else {
            permissions = util.toTitleCase(role.permissions.toArray().join(', ')
                .replace(/[-_]/g, ' ')) || 'None';
        }

        const embed = new Discord.MessageEmbed()
            .setTitle(`About ${role.name}`)
            .setColor(role.color)
            .setImage(role.iconURL())
            .setDescription(`**Role name:** ${role.name} (${role.id})\n` +
                `**Created on** ${role.createdAt.toUTCString()}\n` +
                `**Managed:** ${role.managed ? 'Yes' : 'No'}\n` +
                `**Position:** ${role.position} (from below)\n` +
                `**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n` +
                `**Color:** \`${role.hexColor}\` (\`${role.color}\`)\n` +
                `**Permissions:** ${permissions}`);

        await this.reply(embed);
    }

    static getOptions() {
        return [{
            name: 'role',
            type: 'ROLE',
            description: 'The role to view',
            required: true,
        }];
    }

    parseOptions(args) {
        return [{
            name: 'roleID',
            type: 'STRING',
            value: args[0] === '@everyone' ? this.source.getGuild().roles.everyone.id
                : util.roleMentionToId(args.shift()),
        }];
    }
}

module.exports = RoleInfoCommand;
