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
  let member = await message.guild.members.resolve(userId);

  if (!member) {
    message.react(util.icons.error);
    message.channel.send("User not found!");
    return;
  }

  //highest role check
  if(message.member.roles.highest.comparePositionTo(message.guild.members.resolve(userId).roles.highest) <= 0 || await util.isMod(member)) {
    message.react(util.icons.error);
    message.channel.send("You dont have the Permission to mute that Member!");
    return;
  }

  let config = await util.getGuildConfig(message.guild.id);
  let mutedRole = config.mutedRole;
  if (!mutedRole) {
      message.channel.send("No muted role specified!");
      return;
  }

  let duration = util.timeToSec(args.join(' '));
  while (util.isTime(args[0]))
    args.shift();
  let reason = (args.join(' ') || 'No reason provided.');
  let now = Math.floor(Date.now()/1000);

  let mute = await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]);
  //check user was already muted
  if (mute) {
    database.query("UPDATE moderations SET active = false WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]);
  }

  if (duration) {
    let time = util.secToTime(duration);
    let endsAt = now + duration;

    member.roles.add(mutedRole, `moderator: ${message.author.username}#${message.author.discriminator} duaration: ${time} reason: ` + reason);
    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'mute', now, endsAt, reason, message.author.id]);

    message.channel.send(`Muted \`${member.user.username}#${member.user.discriminator}\` for ${time}: ${reason}`);
    util.log(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` muted \`${member.user.username}#${member.user.discriminator}\` for ${time}: ${reason}`);
  }
  else {
    member.roles.add(mutedRole, `${message.author.username}#${message.author.discriminator}: `+reason);
    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[message.guild.id, userId, 'mute', now, reason, message.author.id]);

    message.channel.send(`Muted \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
    util.log(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` muted \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
  }
}

exports.names = ['mute'];
