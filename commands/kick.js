const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!util.isMod(message.member) || message.member.hasPermission('KICK_MEMBERS')) {
    message.react('🛑');
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }
  let member = await message.guild.members.resolve(userId);

  if (!member) {
    message.channel.send("User not found!");
    return;
  }

  //highest role check
  if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || util.isMod(member)){
    message.channel.send("You dont have the Permission to kick that Member!");
    return;
  }

  let reason = (args.join(' ') || 'No reason provided.');
  let now = Math.floor(Date.now()/1000);

  database.query("INSERT INTO inactiveModerations (guildid, userid, action, created, reason, moderator) VALUES (?,?,'kick',?,?,?)",[message.guild.id, userId, now, reason, message.author.id]);

  member.kick(`${message.author.username}#${message.author.discriminator}: `+reason);

  message.channel.send(`Kicked \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
  util.log(message, `\`${message.author.username}#${message.author.discriminator}\` kicked \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
}

exports.names = ['kick'];
