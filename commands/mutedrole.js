const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    if (!message.guild.member(bot.user.id).hasPermission('MANAGE_CHANNELS')) {
      await message.channel.send("The bot needs the 'MANAGE_CHANNELS' permission to setup the muted role!");
      return;
    }
    if (!message.guild.member(bot.user.id).hasPermission('MANAGE_ROLES')) {
      await message.channel.send("The bot needs the 'MANAGE_ROLES' permission for the muted role!");
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

    let response = await message.channel.send(`Updating channel overwrites...`);

    for ([key, channel] of message.guild.channels.cache) {
      if (!channel.permissionsFor(bot.user.id).has('MANAGE_CHANNELS') || !channel.permissionsFor(bot.user.id).has('VIEW_CHANNEL')) {
        continue;
      }
      await channel.updateOverwrite(role.id, {
        'SEND_MESSAGES': false,
        'ADD_REACTIONS': false,
        'SPEAK': false
      })
    }
    await response.edit(`Set muted role to \`${role.name}\`!`);
}

exports.names = ['mutedrole','muterole'];
