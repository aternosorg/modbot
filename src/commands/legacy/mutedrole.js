const util = require('../../util.js');
const GuildConfig = require('../../GuildConfig');
const {APIErrors} = require('discord.js').Constants;

const command = {};

command.description = 'Specify the muted role';

command.usage = '@role|roleId';

command.names = ['mutedrole','muterole'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    await message.channel.send('You need the "Manage Server" permission to use this command.');
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
    });
  }
  else if (args[0] === 'disable'){
    let config = await GuildConfig.get(message.guild.id);
    delete config.mutedRole;
    await config.save();
    await message.channel.send(`Disabled muted role!`);
    return;
  }
  else{
    //Get role
    role = message.guild.roles.resolve(util.roleMentionToId(args.shift()));
    if (!role) {
      await message.channel.send("Please specify a role (@Mention or ID), or use the subcommands 'create' or 'disable'!");
      return;
    }
  }

  if ((await message.guild.members.fetch(bot.user.id)).roles.highest.comparePositionTo(role) < 0) {
    await message.channel.send("I'm not high enough (in the role list)!");
    return;
  }

  let config = await GuildConfig.get(message.guild.id);
  let oldRole = config.mutedRole;
  config.mutedRole = role.id;
  await config.save();
  let response = await message.channel.send(`Updating current mutes...`);

  if (oldRole !== role.id) {
    for (let mute of await database.queryAll("SELECT * FROM moderations WHERE action = 'mute' AND active = TRUE AND guildid = ?",[message.guild.id])) {
      const member = await message.guild.members.fetch(mute.userid);
      if (member) {
        try {
          await member.roles.add(role.id);
          if (member.roles.cache.get(oldRole)) {
            await member.roles.remove(oldRole);
          }
        }
        catch (e) {
          if (e.code === APIErrors.MISSING_PERMISSIONS) {
            await message.channel.send(`Missing permissions to edit these roles. Please make sure that both muted roles are below me!`);
          }
          else {
            throw e;
          }
        }
      }
    }
  }

  await response.edit(`Updating channel overwrites...`);

  for (let [, channel] of message.guild.channels.cache) {
    if (!channel.permissionsFor(bot.user.id).has('MANAGE_CHANNELS') || !channel.permissionsFor(bot.user.id).has('VIEW_CHANNEL')) {
      continue;
    }
    await channel.updateOverwrite(role.id, {
      'SEND_MESSAGES': false,
      'ADD_REACTIONS': false,
      'SPEAK': false
    });
  }
  await response.edit(`Set muted role to \`${role.name}\`!`);
};

module.exports = command;
