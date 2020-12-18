const util = require('../util.js');
const GuildConfig = require('../GuildConfig');

const command = {};

command.description = 'Add or remove modroles';

command.usage = 'add|remove @role|roleId';

command.names = ['modrole','modroles'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    message.channel.send('You need the "Manage Server" Permission to use this command.');
    return;
  }

  /** @type {GuildConfig} */
  const config = await GuildConfig.get(message.guild.id);
  let role;
  switch (args.shift()) {
    case 'add':
      //Get role
      role = message.guild.roles.resolve(util.roleMentionToId(args.shift()));
      if (!role) {
        await message.channel.send("Please specify a role! (@mention or ID)");
        return;
      }
      config.addModRole(role.id);
      await config.save();
      await message.channel.send(`Added \`${role.name}\` as a moderator role!`);
      break;

    case 'remove':
      //Get role
      role = message.guild.roles.resolve(util.roleMentionToId(args.shift()));
      if (!role) {
        await message.channel.send("Please specify a role! (@mention or ID)");
        return;
      }

      if (!config.isModRole(role.id)) {
        await message.channel.send("That role is not a moderator role");
        return;
      }

      config.removeModRole(role.id);
      await config.save();
      await message.channel.send(`Removed \`${role.name}\` from moderator roles!`);
      break;

    default:
      await message.channel.send("Valid subcommands: add, remove");
  }
};

module.exports = command;
