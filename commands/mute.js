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
  let reason = (args.join(' ') || 'No reason provided.');
  let now = Math.floor(Date.now()/1000);
  if (duration) {
    let time = util.secToTime(duration);
    while (util.isTime(args[0]))
      args.shift();

    let endsAt = now + duration;


    member.roles.add(mutedRole, `duaration: ${time} reason:` + reason);
    //check user was already muted
    if (await database.query("SELECT action FROM moderations WHERE guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId])) {
      database.query("UPDATE moderations SET lastChanged = ?, value = ?, reason = ?, moderator = ?, tocheck = TRUE WHERE guildid = ? AND userid = ? AND action = 'mute'",[now, endsAt, reason, message.author.id, message.guild.id, userId]);
    }
    else {
      database.query("INSERT INTO moderations (guildid, userid, action, lastChanged, value, reason, moderator) VALUES (?,?,'mute',?,?,?,?)",[message.guild.id, userId, now, endsAt, reason, message.author.id]);
    }

    util.log(message, `Muted \`${member.user.username}#${member.user.discriminator}\` for ${time}: ${reason}`);
    message.channel.send(`${message.author.username} muted \`${member.user.username}#${member.user.discriminator}\` for ${time}: ${reason}`);
  }
  else {
    member.roles.add(mutedRole, reason);
    //check user was already muted
    if (await database.query("SELECT action FROM moderations WHERE guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId])) {
      database.query("UPDATE moderations SET value = 0, tocheck = 0, lastChanged = ?, reason = ?, moderator = ? WHERE guildid = ? AND userid = ? AND action = 'mute'",[now, reason, message.author.id, message.guild.id, userId]);
    }
    else {
      database.query("INSERT INTO moderations (action, value, tocheck, guildid, userid, lastChanged, reason, moderator) VALUES ('mute',0,0,?,?,?,?,?)",[message.guild.id, userId, now, reason,message.author.id]);
    }

    message.channel.send(`Muted \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
    util.log(message, `${message.author.username} muted \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
  }
}

exports.names = ['mute'];
