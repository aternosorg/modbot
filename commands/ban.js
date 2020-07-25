const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!util.isMod(message.member) || message.member.hasPermission('BAN_MEMBERS')) {
    message.react('🛑');
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }
  let user = await bot.users.fetch(userId);

  if (!user) {
    message.channel.send("User not found!");
    return;
  }

  //highest role & mod check
  if(message.guild.members.resolve(user)) {
    let member = await message.guild.members.resolve(user);
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || util.isMod(member)) {
      message.channel.send("You dont have the Permission to ban that Member!")
      return;
    }
  }

  let duration = util.timeToSec(args.join(' '));
  while (util.isTime(args[0]))
    args.shift();
  let reason = (args.join(' ') || 'No reason provided.');
  let now = Math.floor(Date.now()/1000);

  let ban = await database.query("SELECT * FROM activeModerations WHERE guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId]);
  //check user was already banned
  if (ban) {
    database.query("INSERT INTO inactiveModerations (guildid, userid, action, created, value, reason, moderator) VALUES (?,?,'ban',?,?,?,?)",[ban.guildid,ban.userid,ban.created,ban.value,ban.reason,ban.moderator]);
    database.query("DELETE FROM activeModerations WHERE action = 'ban' AND userid = ? AND guildid = ?",[ban.userid,ban.guildid]);
  }

  if (duration) {
    let time = util.secToTime(duration);

    let endsAt = now + duration;

    message.guild.members.ban(userId, {days: 7, reason: `duaration: ${time} reason:` + reason});

    database.query("INSERT INTO activeModerations (guildid, userid, action, created, value, reason, moderator) VALUES (?,?,'ban',?,?,?,?)",[message.guild.id, userId, now, endsAt, reason, message.author.id]);

    message.channel.send(`Banned \`${user.username}#${user.discriminator}\` for ${time}: ${reason}`);
    util.log(message, `\`${message.author.username}#${message.author.discriminator}\` banned \`${user.username}#${user.discriminator}\` for ${time}: ${reason}`);
  }
  else {
    message.guild.members.ban(userId, {days: 7, reason: `#${message.author.username}#${message.author.discriminator}: ` + reason});

    database.query("INSERT INTO activeModerations (action, value, timed, guildid, userid, created, reason, moderator) VALUES ('ban',0,0,?,?,?,?,?)",[message.guild.id, userId, now, reason,message.author.id]);

    message.channel.send(`Banned \`${user.username}#${user.discriminator}\`: ${reason}`);
    util.log(message, `\`${message.author.username}#${message.author.discriminator}\` banned \`${user.username}#${user.discriminator}\`: ${reason}`);
  }
}

exports.names = ['ban'];
