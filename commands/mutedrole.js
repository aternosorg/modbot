const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    let roleId;

    if (['create','new'].includes(args[0])) {
      let role = await message.guild.roles.create({
        data: {
          name: 'muted',
          hoist: false
        }
      })
      roleId = role.id;
    }
    else {
      //Get role
      roleId = util.roleMentionToId(args.shift());;
      if (roleId && !message.guild.roles.resolve(roleId)) {
        await message.channel.send("Please specify a role(@mention or ID) or use 'new' to create one!");
        return;
      }
    }


    let guildId = message.guild.id;

    let config = await util.getGuildConfig(message);
    config.mutedRole = roleId;
    util.saveGuildConfig(config);

    if (roleId) {
      await message.channel.send(`Set muted role to <@&${roleId}>!`);
      for ([key, channel] of message.guild.channels.cache) {
        channel.overwritePermissions([{
          id: roleId,
          deny: ['SEND_MESSAGES','SPEAK']
        }]);
      }
    }
    else {
      await message.channel.send(`Disabled muted role!`);
    }
}

exports.names = ['mutedrole'];
