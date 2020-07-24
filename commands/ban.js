const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!message.member.hasPermission('BAN_MEMBERS')) {
    message.react('🛑');
    return;
  }

  let userId = util.userMentionToId(args.shift());
  let user = await bot.users.fetch(userId);

  if (!user) {
    message.react('🛑');
    message.channel.send("User not found!");
    return;
  }

  //highest role check
  if(message.guild.members.resolve(user)) {
    if(message.member.roles.highest.comparePositionTo(message.guild.members.resolve(user).roles.highest) <= 0) {
      message.react('🛑');
      message.channel.send("You dont have the Permission to ban that Member!")
      return;
    }
  }

  let duration = util.timeToSec(args.join(' '));
  let reason = (args.join(' ') || 'No reason provided.');
  let now = Math.floor(Date.now()/1000);
  if (duration) {
    let time = util.secToTime(duration);
    while (util.isTime(args[0]))
      args.shift();

    let endsAt = now + duration;

    message.guild.members.ban(userId, {days: 7, reason: `duaration: ${time} reason:` + reason});

    //check user was already banned
    if (await database.query("SELECT action FROM moderations WHERE guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId])) {
      database.query("UPDATE moderations SET lastChanged = ?, value = ?, reason = ?, moderator = ? WHERE guildid = ? AND userid = ? AND action = 'ban'",[now, endsAt, reason, message.author.id, message.guild.id, userId]);
    }
    else {
      database.query("INSERT INTO moderations (guildid, userid, action, lastChanged, value, reason, moderator) VALUES (?,?,'ban',?,?,?,?)",[message.guild.id, userId, now, endsAt, reason, message.author.id]);
    }

    util.log(message, `Banned \`${user.username}#${user.discriminator}\` for ${time}: ${reason}`);
    message.channel.send(`${message.author.username} banned \`${user.username}#${user.discriminator}\` for ${time}: ${reason}`);
  }
  else {
    message.guild.members.ban(userId, {days: 7, reason: reason});

    //check user was already banned
    let ban = await database.query("SELECT action FROM moderations WHERE guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId])
    if (ban) {
      database.query("UPDATE moderations SET value = 0, tocheck = 0, lastChanged = ?, reason = ?, moderator = ? WHERE guildid = ? AND userid = ? AND action = 'ban'",[now, reason, message.author.id, message.guild.id, userId]);
    }
    else {
      database.query("INSERT INTO moderations (action, value, tocheck, guildid, userid, lastChanged, reason, moderator) VALUES ('ban',0,0,?,?,?,?,?)",[message.guild.id, userId, now, reason,message.author.id]);
    }

    message.channel.send(`Banned \`${user.username}#${user.discriminator}\`: ${reason}`);
    util.log(message, `${message.author.username} banned \`${user.username}#${user.discriminator}\`: ${reason}`);
  }
}

exports.names = ['ban'];
