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
    message.react('🛑');
    message.channel.send("User not found!");
    return;
  }

  let mute = await database.query("SELECT * FROM activeModerations WHERE guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]);
  if(!mute) {
    message.react('🛑');
    message.channel.send("User isn't muted here!");
    return;
  }

  let reason = (args.join(' ') || 'No reason provided.');
  let now = Math.floor(Date.now()/1000);

  if (message.guild.members.resolve(userId)) {
    let guildConfig = await util.getGuildConfig(message);
    message.guild.members.resolve(userId).roles.remove([guildConfig.mutedRole], `${message.author.username}#${message.author.discriminator}: ` + reason);
  }
  database.query("INSERT INTO inactiveModerations (guildid, userid, action, created, value, reason, moderator) VALUES (?,?,'mute',?,?,?,?)",[mute.guildid,mute.userid,mute.created,mute.value,mute.reason,mute.moderator]);
  database.query("DELETE FROM activeModerations WHERE action = 'mute' AND userid = ? AND guildid = ?",[mute.userid,mute.guildid]);
  database.query("INSERT INTO activeModerations (guildid, userid, action, created, reason, moderator) VALUES (?,?,'unmute',?,?,?)",[message.guild.id, userId, now, reason, message.author.id]);

  util.log(message, `\`${message.author.username}#${message.author.discriminator}\` unmuted \`${user.username}#${user.discriminator}\`: ${reason}`);
  message.channel.send(`Unmuted \`${user.username}#${user.discriminator}\`: ${reason}`);

}

exports.names = ['unmute'];
