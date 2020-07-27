const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('KICK_MEMBERS')) {
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
  if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
    message.react(util.icons.error);
    message.channel.send("You dont have the Permission to kick that Member!");
    return;
  }

  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator, active) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'kick', now, reason, message.author.id,false]);

  await member.send(`You were kicked from \`${message.guild.name}\`: ${reason}`);
  member.kick(`${message.author.username}#${message.author.discriminator}: `+reason);

  message.channel.send(`Kicked \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
  util.log(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` kicked \`${member.user.username}#${member.user.discriminator}\`: ${reason}`);
}

exports.names = ['kick'];
