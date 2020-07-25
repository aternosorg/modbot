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
  if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0){
    message.react('🛑');
    message.channel.send("You dont have the Permission to ban that Member!");
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
