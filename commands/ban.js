const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  if (!util.userMentionToId(args[0])) {
    await message.react(util.icons.error);
    await message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }

  let user;
  try {
    user = await bot.users.fetch(util.userMentionToId(args.shift()));
  } catch (e) {
    await message.react(util.icons.error);
    await message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }

  if (user.bot) {
    await message.react(util.icons.error);
    await message.channel.send("You cant interact with bots!");
    return;
  }

  let duration = util.timeToSec(args.join(' '));
  let member = await message.guild.members.resolve(user);
  //highest role & mod check
  if(message.guild.members.resolve(user)) {
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)) {
      await message.react(util.icons.error);
      await message.channel.send("You dont have the Permission to ban that Member!")
      return;
    }
  }
  while (util.isTime(args[0]))
    args.shift();

  ban(message.guild, user, message.author, args.join(' '), duration, message.channel)
}

async function ban(guild, user, moderator, reason, duration, channel) {
  reason = reason || 'No reason provided.';
  let time = util.secToTime(duration);

  try {
    let member = await guild.members.fetch(user.id);
    if (duration) {
      await member.send(`You were banned from \`${guild.name}\` for ${time} | ${reason}`);
    }
    else {
      await member.send(`You were permanently banned from \`${guild.name}\` | ${reason}`);
    }
  } catch (e) {}

  if (duration) {
    await guild.members.ban(user.id, {days: 7, reason: `${moderator.username}#${moderator.discriminator} (${time}), Reason:` + reason});
  }
  else {
    await guild.members.ban(user.id, {days: 7, reason: `${moderator.username}#${moderator.discriminator} | ` + reason});
  }

  let insert = await util.moderationDBAdd(guild.id, user.id, "ban", reason, duration, moderator.id);
  if (channel) {
    await util.chatSuccess(channel, user, reason, "banned", time);
  }
  await util.logMessageModeration(guild.id, moderator, user, reason, insert, "Ban", time);
}

exports.names = ['ban'];
