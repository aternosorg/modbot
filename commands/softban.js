const util = require('../lib/util.js');

const command = {};

command.description = 'Softban a user (kick and delete messages)';

command.usage = '@member|memberId <reason>';

command.names = ['softban'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('KICK_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let member;
  try {
    member = await message.guild.members.fetch(userId);
  } catch (e) {
    await message.react(util.icons.error);
    await message.channel.send("User not found or not in guild!");
    return;
  }

  if (member.user.bot) {
    await message.react(util.icons.error);
    await message.channel.send("You can't interact with bots!");
    return;
  }

  //highest role check
  if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
    await message.react(util.icons.error);
    await message.channel.send("You don't have the Permission to softban that Member!");
    return;
  }

  await command.softban(message.guild, member, message.author, args.join(' '), message.channel);
};

command.softban = async (guild, member, moderator, reason, channel) => {
  reason = reason || 'No reason provided.';

  let insert = await util.moderationDBAdd(guild.id, member.id, "softban", reason, null, moderator.id);

  try {
    await member.send(`You were softbanned from \`${guild.name}\` | ${reason}`);
  } catch (e) {}
  await guild.members.ban(member.id,{days: 7, reason: `${moderator.username}#${moderator.discriminator} | `+reason});
  await guild.members.unban(member.id,`Softban`);

  if (channel) {
    await util.chatSuccess(channel, member.user, reason, "softbanned");
  }
  await util.logMessageModeration(guild.id, moderator, member.user, reason, insert, "Softban");
};

module.exports = command;
