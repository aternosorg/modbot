const util = require('../lib/util.js');
const Discord = require('discord.js');

exports.command = async (message, args, database, bot) => {
  if(!message.member.hasPermission('BAN_MEMBERS')) {
    message.react('🛑');
    return;
  }

  let userId = util.userMentionToId(args.shift());
  let user = await bot.users.fetch(userId);

  if (!user) {
    message.channel.send("User not found!");
    return;
  }

  //highest role check

  let duration = util.timeToSec(args.join(' '));
  let time = util.secToTime(duration);
  while (util.isTime(args[0]))
    args.shift();

  let reason = (args.join(' ') || 'No reason provided.')
  let now = Math.floor(Date.now()/1000);
  let endsAt = now + duration;

  message.guild.members.ban(userId, {days: 7, reason: `duaration: ${time} reason:` + reason});

  //check user was already banned
  let ban = await database.query("SELECT action FROM moderations WHERE guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId])
  if (ban) {
    database.query("UPDATE moderations SET lastChanged = ?, value = ?, reason = ? WHERE guildid = ? AND userid = ? AND action = 'ban'",[now, endsAt, reason, message.guild.id, userId]);
  }
  else {
    database.query("INSERT INTO moderations (guildid, userid, action, lastChanged, value, reason) VALUES (?,?,'ban',?,?,?)",[message.guild.id, userId, now, endsAt, reason]);
  }

  util.log(message, `Banned \`${user.username}#${user.discriminator}\` for ${time}: ${reason}`);
  message.channel.send(`Banned \`${user.username}#${user.discriminator}\` for ${time}: ${reason}`);
}

exports.names = ['ban'];
