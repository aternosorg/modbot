const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    message.react(util.icons.error);
    message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }
  let user = await bot.users.fetch(userId);

  if (!user) {
    message.react(util.icons.error);
    message.channel.send("User not found!");
    return;
  }

  let member
  //highest role & mod check
  if(message.guild.members.resolve(user)) {
    member = await message.guild.members.resolve(user);
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)) {
      message.react(util.icons.error);
      message.channel.send("You dont have the Permission to ban that Member!")
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
    database.query("UPDATE moderations SET active = FALSE WHERE guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId])
  }

  if (duration) {
    let time = util.secToTime(duration);
    let endsAt = now + duration;

    if (member) {
      await member.send(`You were banned from \`${message.guild.name}\` for ${time}: ${reason}`);
    }
    message.guild.members.ban(userId, {days: 7, reason: `duaration: ${time} reason:` + reason});

    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'ban', now, endsAt, reason, message.author.id]);

    message.channel.send(`Banned \`${user.username}#${user.discriminator}\` for ${time}: ${reason}`);
    util.logMessage(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` banned \`${user.username}#${user.discriminator}\` for ${time}: ${reason}`);
  }
  else {
    if (member) {
      await member.send(`You were permanently banned from \`${message.guild.name}\`: ${reason}`);
    }
    message.guild.members.ban(userId, {days: 7, reason: `#${message.author.username}#${message.author.discriminator}: ` + reason});

    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[message.guild.id, userId, 'ban', now, reason, message.author.id]);

    message.channel.send(`Banned \`${user.username}#${user.discriminator}\`: ${reason}`);
    util.logMessage(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` banned \`${user.username}#${user.discriminator}\`: ${reason}`);
  }
}

exports.names = ['ban'];
