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

  let ban = await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId]);
  //check user was already banned
  if (ban) {
    await database.query("UPDATE moderations SET active = FALSE WHERE guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId])
  }

  if (duration) {
    let time = util.secToTime(duration);
    let endsAt = now + duration;

    if (member) {
      await member.send(`You were banned from \`${message.guild.name}\` for ${time} | ${reason}`);
    }
    await message.guild.members.ban(userId, {days: 7, reason: `${message.author.username}#${message.author.discriminator} (${time}), Reason:` + reason});

    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'ban', now, endsAt, reason, message.author.id]);

    await message.channel.send(`Banned \`${user.username}#${user.discriminator}\` for ${time} | ${reason}`);
    await util.logMessage(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` banned \`${user.username}#${user.discriminator}\` (ID: ${user.id})\nDuration: **${time}**\nReason: **${reason}**`);
  }
  else {
    if (member) {
      await member.send(`You were permanently banned from \`${message.guild.name}\` | ${reason}`);
    }
    await message.guild.members.ban(userId, {days: 7, reason: `${message.author.username}#${message.author.discriminator}, Reason: ` + reason});

    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[message.guild.id, userId, 'ban', now, reason, message.author.id]);

    await message.channel.send(`Banned \`${user.username}#${user.discriminator}\` | ${reason}`);
    await util.logMessage(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` banned \`${user.username}#${user.discriminator}\` (ID: ${user.id})\nReason: **${reason}**`);
  }
}

exports.names = ['ban'];
