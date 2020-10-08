const util = require('../lib/util.js');

const command = {};

command.description = 'Softban a user (kick and delete messages)';

command.usage = '@member|id <@member|id…> <reason>';

command.names = ['softban'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('KICK_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let users = await util.userMentions(args);

  if (!users.length) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let reason = args.join(' ');

  for (let userId of users) {
    let member;
    try {
      member = await message.guild.members.fetch(userId);
    } catch (e) {
      await message.react(util.icons.error);
      await message.channel.send("User not found or not in guild!");
      continue;
    }

    if (member.user.bot) {
      await message.react(util.icons.error);
      await message.channel.send("You can't interact with bots!");
      continue;
    }

    //highest role check
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
      await message.react(util.icons.error);
      await message.channel.send("You don't have the permission to softban that member!");
      continue;
    }

    await command.softban(message.guild, member, message.author, reason, message.channel);
  }
};

command.softban = async (guild, member, moderator, reason, channel) => {
  reason = reason || 'No reason provided.';

  try {
    await member.send(`You were softbanned from \`${guild.name}\` | ${reason}`);
  } catch (e) {}
  await guild.members.ban(member.id,{days: 1, reason: `${moderator.username}#${moderator.discriminator} | `+reason});
  await guild.members.unban(member.id,`Softban`);

  if (channel) {
    await util.chatSuccess(channel, member.user, reason, "softbanned");
  }
  let insert = await util.moderationDBAdd(guild.id, member.id, "softban", reason, null, moderator.id);
  await util.logMessageModeration(guild.id, moderator, member.user, reason, insert, "Softban");
};

module.exports = command;
