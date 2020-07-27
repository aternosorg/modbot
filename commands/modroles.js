const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    let guildId = message.guild.id;
    let config = await util.getGuildConfig(message);
    let roleId;
    switch (args.shift()) {
      case 'add':
        //Get role
        roleId = util.roleMentionToId(args.shift());;
        if (!message.guild.roles.resolve(roleId)) {
          await message.channel.send("Please specify a role! (@mention or ID)");
          return;
        }
        config.addModRole(roleId);
        await util.saveGuildConfig(config);
        await message.channel.send(`Added <@&${roleId}> as a moderator role!`);
        break;

      case 'remove':
        //Get role
        roleId = util.roleMentionToId(args.shift());;
        if (!message.guild.roles.resolve(roleId)) {
          await message.channel.send("Please specify a role! (@mention or ID)");
          return;
        }

        if (!config.isModRole(roleId)) {
          await message.channel.send("That role is not a moderator role")
          return;
        }

        config.removeModRole(roleId);
        util.saveGuildConfig(config);
        message.channel.send(`Removed <@&${roleId}> from moderator roles!`);
        break;

      case 'list':
        //LIST
        break;
      default:
        await message.channel.send("Valid subcommands: add, remove, list");
    }

}

exports.names = ['modrole','modroles'];
