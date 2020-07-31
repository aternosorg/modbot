const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    await message.react(util.icons.error);
    await message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }

  let user;
  try {
    user = await bot.users.fetch(userId);
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

  let member
  //highest role & mod check
  if(message.guild.members.resolve(user)) {
    member = await message.guild.members.resolve(user);
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)) {
      await message.react(util.icons.error);
      await message.channel.send("You dont have the Permission to ban that Member!")
      return;
    }
  }

  let duration = util.timeToSec(args.join(' '));
  while (util.isTime(args[0]))
    args.shift();
  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  let id = await util.moderationDBAdd(message.guild.id, userId, 'ban', reason, duration, message.author.id);

  if (duration) {
    let time = util.secToTime(duration);
    await message.guild.members.ban(userId, {days: 7, reason: `${message.author.username}#${message.author.discriminator} (${time}), Reason:` + reason});

    if (member) {
      try {
        await member.send(`You were banned from \`${message.guild.name}\` for ${time} | ${reason}`);
      } catch (e) {
      }
    }
    await message.guild.members.ban(userId, {days: 7, reason: `${message.author.username}#${message.author.discriminator} (${time}) | ` + reason});

    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'ban', now, endsAt, reason, message.author.id]);

    await util.chatSuccess(message, message, user, reason, "banned", time);
    await util.logMessageModeration(message, message, user, reason, insert, "Ban", time);
  }
  else {
    if (member) {
      await member.send(`You were permanently banned from \`${message.guild.name}\` | ${reason}`);
    }
    await message.guild.members.ban(userId, {days: 7, reason: `${message.author.username}#${message.author.discriminator} | ` + reason});

    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[message.guild.id, userId, 'ban', now, reason, message.author.id]);

    await util.chatSuccess(message, message, user, reason, "banned");
    await util.logMessageModeration(message, message, user, reason, insert, "Ban");
  }
}

exports.names = ['ban'];
