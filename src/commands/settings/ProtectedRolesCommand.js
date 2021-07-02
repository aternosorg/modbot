const Command = require('../../Command');
const util = require('../../util.js');
const Discord = require('discord.js');
const Guild = require('../../Guild');

class ProtectedRolesCommand extends Command {

    static description = 'Manage protected roles';

    static usage = 'add|remove|list <[@role|id]>';

    static names = ['protectedroles','protectedrole','protected','protect'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length < 1) {
            await this.sendUsage();
            return;
        }

        const guild = new Guild(this.message.guild);
        let role;
        switch (this.args[0].toLowerCase()) {
            case 'list':
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription(`Active moderator roles: ${this.guildConfig.listProtectedRoles()}`)
                    .setColor(util.color.green)
                );
                break;

            case 'add':
                if (this.args.length !== 2) return this.sendUsage();

                role = util.roleMentionToId(this.args[1]);
                if (role === null || await guild.fetchRole(role) === null) return this.sendUsage();

                if (this.guildConfig.isProtectedRole(role)) {
                    return this.message.channel.send(new Discord.MessageEmbed()
                        .setDescription(`<@&${role}> is already a protected role!`)
                        .setColor(util.color.red)
                    );
                }

                this.guildConfig.addProtectedRole(role);
                await this.guildConfig.save();
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription(`Added <@&${role}> as a protected role!`)
                    .setColor(util.color.green)
                );
                break;

            case 'remove':
                if (this.args.length !== 2) return this.sendUsage();

                role = util.roleMentionToId(this.args[1]);
                if (role === null || await guild.fetchRole(role) === null) return this.sendUsage();

                if (!this.guildConfig.isProtectedRole(role)) {
                    return this.message.channel.send(new Discord.MessageEmbed()
                        .setDescription(`<@&${role}> is not a protected role!`)
                        .setColor(util.color.red)
                    );
                }

                this.guildConfig.removeModRole(role);
                await this.guildConfig.save();
                await this.message.channel.send(new Discord.MessageEmbed()
                    .setDescription(`<@&${role}> is no longer a protected role!`)
                    .setColor(util.color.green)
                );
                break;

            default:
                await this.sendUsage();
        }
    }
}

module.exports = ProtectedRolesCommand;
