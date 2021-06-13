const Command = require('../../Command')
const Discord = require('discord.js');

class RoleInfoCommand extends Command{
  
  static names = ['roleinfo', 'ri', 'role'];
  
  static usage = '<RoleID>';
  
  static description = 'Get information about a role';
  
  async execute() {
      if (!this.args.length) {
          return await this.message.channel.send(`You have to provide a role ID ${message.author}!`)
      }

      let role = this.message.guild.roles.resolve(this.args[0]);
      if (!role) return await this.message.channel.send(`This is not a valid role ID.`)


      let permissions;
      if (role.permissions.has('ADMINISTRATOR')) {
          permissions = `Administrator`
      } 
      if (!role.permissions.has('ADMINISTRATOR')) {
          permissions = role.permissions.toArray().toString()
          permissions = permissions.toLowerCase()
          permissions = permissions.replace(/[-_]/g, ' ')
          permissions = permissions.replace(/[,]/g, ", ")
      } 
      if (!permissions) {
          permissions = `None`
      }

          const embed = new Discord.MessageEmbed()
              .setTitle(`About role ${role.name}`)
              .setColor(role.color)
              .setDescription(`**Role name:** ${role.name} (${role.id})\n` +
                              `**Created on** ${role.createdAt.toUTCString()}\n` +
                              `**From guild:** ${role.guild}\n` +
                              `**Managed:** ${role.managed ? 'Yes' : 'No'}\n` +
                              `**Position:** ${role.position} (from below)\n` +
                              `**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n` +
                              `**Color:** \`${role.hexColor}\` (\`${role.color}\`)\n` +
                              `**Permissions:** ${permissions}`)

          await this.message.channel.send(embed);


      }
}

module.exports = RoleInfoCommand;
