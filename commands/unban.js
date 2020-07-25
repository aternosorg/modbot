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

  let ban = await database.query("SELECT * FROM activeModerations WHERE guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId]);
  if(!ban) {
    message.react('🛑');
    message.channel.send("User isn't banned here!");
    return;
  }

  let reason = (args.join(' ') || 'No reason provided.');
  let now = Math.floor(Date.now()/1000);

  message.guild.members.unban(userId, `${message.author.username}#${message.author.discriminator}: ` + reason);

  database.query("INSERT INTO inactiveModerations (guildid, userid, action, created, value, reason, moderator) VALUES (?,?,'ban',?,?,?,?)",[ban.guildid,ban.userid,ban.created,ban.value,ban.reason,ban.moderator]);
  database.query("DELETE FROM activeModerations WHERE action = 'ban' AND userid = ? AND guildid = ?",[ban.userid,ban.guildid]);
  database.query("INSERT INTO activeModerations (guildid, userid, action, created, reason, moderator) VALUES (?,?,'unban',?,?,?)",[message.guild.id, userId, now, reason, message.author.id]);

  util.log(message, `\`${message.author.username}#${message.author.discriminator}\` unbanned \`${user.username}#${user.discriminator}\`: ${reason}`);
  message.channel.send(`Unbanned \`${user.username}#${user.discriminator}\`: ${reason}`);

}

exports.names = ['unban'];
