/* eslint-disable */

const Command = require('../../Command')
const Discord = require('discord.js');

class RoleInfoCommand extends Command{
  
  static names = ['roleinfo', 'ri', 'role'];
  
  static usage = '<RoleID>';
  
  static description = 'Get information about a role';
  
  async execute() {
      if (!args.length) {
          return await message.channel.send(`You have to provide a role ID ${message.author}!`)
      }

      let role = message.guild.roles.resolve(args[0]);
      if (!role) return await message.channel.send(`This is not a valid role ID.`)

      let generic = '';
      generic += `**Role name:** ${role.name} (${role.id})\n`;
      generic += `**Created on** ${role.createdAt.toUTCString()}\n`;
      generic += `**From guild:** ${role.guild}\n`
      generic += `**Managed:** ${role.managed ? 'Yes' : 'No'}\n`
      generic += `**Position:** ${role.position} (from below)\n`
      generic += `**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n`
      generic += `**Color:** \`${role.hexColor}\` (\`${role.color}\`)`

      let permissions;
      if (role.permissions.has('ADMINISTRATOR')) {
          permissions = `Administrator`
      } if (!role.permissions.has('ADMINISTRATOR')) {
          permissions = role.permissions.toArray().toString()
          permissions = permissions.toLowerCase()
          permissions = permissions.replace(/[-_]/g, ' ')
          permissions = permissions.replace(/[,]/g, ", ")
      } if (!permissions) {
          permissions = `None`
      }

          const embed = new Discord.MessageEmbed()
              .setTitle(`About role ${role.name}`)
              .setColor(role.color)
              .setDescription(`
${generic}

**Permissions:** ${permissions}
              `)

          await message.channel.send(embed);


      }
}

module.exports = RoleInfoCommand;
