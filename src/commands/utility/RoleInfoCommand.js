const Command = require('../../Command');
const Discord = require('discord.js');
const util = require('../../util');

class RoleInfoCommand extends Command{
  
  static names = ['roleinfo', 'ri', 'role'];
  
  static usage = '<RoleID>';
  
  static description = 'Get information about a role';
  
  async execute() {
      if (!this.args.length) {
          return await this.message.channel.send(`You have to provide a role ID ${this.message.author}!`);
      }

      let roleid = util.roleMentionToId(this.args[0]);
    
      if (!roleid) return this.sendUsage();
    
      let role = this.message.guild.roles.resolve(roleid);
      if (!role) return await this.message.channel.send('This is not a valid role ID.');


      let permissions;
      if (role.permissions.has('ADMINISTRATOR')) {
          permissions = 'Administrator';
      }
      else {
          permissions = util.toTitleCase(role.permissions.toArray().join(', ')
              .replace(/[-_]/g, ' ')) || 'None';
      }

      const embed = new Discord.MessageEmbed()
          .setTitle(`About ${role.name}`)
          .setColor(role.color)
          .setDescription(`**Role name:** ${role.name} (${role.id})\n` +
                              `**Created on** ${role.createdAt.toUTCString()}\n` +
                              `**Managed:** ${role.managed ? 'Yes' : 'No'}\n` +
                              `**Position:** ${role.position} (from below)\n` +
                              `**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n` +
                              `**Color:** \`${role.hexColor}\` (\`${role.color}\`)\n` +
                              `**Permissions:** ${permissions}`);

      await this.message.channel.send(embed);
  }
}

module.exports = RoleInfoCommand;
