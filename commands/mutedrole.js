const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    let role;

    if (['create','new'].includes(args[0])) {
      role = await message.guild.roles.create({
        data: {
          name: 'muted',
          hoist: false
        }
      })
    }
    else if (args[0] === 'disable'){
      let config = await util.getGuildConfig(message);
      delete config.mutedRole;
      await util.saveGuildConfig(config);
      await message.channel.send(`Disabled muted role!`);
      return;
    }
    else{
      //Get role
      role = message.guild.roles.resolve(util.roleMentionToId(args.shift()))
      if (!role) {
        await message.channel.send("Please specify a role(@mention or ID), or use the subcommands 'create' or 'disable'!");
        return;
      }
    }

    let config = await util.getGuildConfig(message);
    config.mutedRole = role.id;
    await util.saveGuildConfig(config);

    for ([key, channel] of message.guild.channels.cache) {
      let perms = channel.permissionOverwrites
      if (perms.get(role.id)) {
        perms.get(role.id).update({
          'SEND_MESSAGES': false,
          'SPEAK': false
        })
      }
      else {
        perms.set(role.id,{
          id: role.id,
          deny: ['SEND_MESSAGES','SPEAK']
        })
      }
      await channel.overwritePermissions(perms);
    }
    await message.channel.send(`Set muted role to \`${role.name}\`!`);
}

exports.names = ['mutedrole','muterole'];
