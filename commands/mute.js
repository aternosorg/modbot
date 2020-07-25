const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!message.member.hasPermission('BAN_MEMBERS')) {
    message.react('🛑');
    return;
  }

  let userId = util.userMentionToId(args.shift());
  let member = await message.guild.members.resolve(userId);

  if (!member) {
    message.react('🛑');
    message.channel.send("User not found!");
    return;
  }

  //highest role check
  if(message.member.roles.highest.comparePositionTo(message.guild.members.resolve(userId).roles.highest) <= 0) {
    message.react('🛑');
    message.channel.send("You dont have the Permission to mute that Member!");
    return;
  }

  let mutedRole = await util.mutedRole(message.guild.id);
  let duration = util.timeToSec(args.join(' '));
  while (util.isTime(args[0]))
    args.shift();
  let reason = (args.join(' ') || 'No reason provided.');
  let now = Math.floor(Date.now()/1000);

  let mute = await database.query("SELECT * FROM activeModerations WHERE guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]);
  //check user was already muted
  if (mute) {
    database.query("INSERT INTO inactiveModerations (guildid, userid, action, created, value, reason, moderator) VALUES (?,?,'mute',?,?,?,?)",[mute.guildid,mute.userid,mute.created,mute.value,mute.reason,mute.moderator]);
    database.query("DELETE FROM activeModerations WHERE action = 'mute' AND userid = ? AND guildid = ?",[mute.userid,mute.guildid]);
  }

  if (duration) {
    let time = util.secToTime(duration);

    let endsAt = now + duration;

    member.roles.add(mutedRole, `moderator: ${message.author.username}#${message.author.discriminator} duaration: ${time} reason: ` + reason);
    database.query("INSERT INTO activeModerations (guildid, userid, action, created, value, reason, moderator) VALUES (?,?,'mute',?,?,?,?)",[message.guild.id, userId, now, endsAt, reason, message.author.id]);

    message.channel.send(`Muted \`${member.user.username}#${member.user.discriminator}\` for ${time}: ${reason}`);
    util.log(message, `\`${message.author.username}#${message.author.discriminator}\` muted \`${member.user.username}#${member.user.discriminator}\` for ${time}: ${reason}`);
  }
  else {
    member.roles.add(mutedRole, `${message.author.username}#${message.author.discriminator}: `+reason);
    database.query("INSERT INTO activeModerations (action, value, timed, guildid, userid, created, reason, moderator) VALUES ('mute',0,0,?,?,?,?,?)",[message.guild.id, userId, now, reason,message.author.id]);

    message.channel.send(`Muted \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
    util.log(message, `\`${message.author.username}#${message.author.discriminator}\` muted \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
  }
}

exports.names = ['mute'];
