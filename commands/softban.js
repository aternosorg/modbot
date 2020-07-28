const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('KICK_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    await message.react(util.icons.error);
    await message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }
  let member = await message.guild.members.resolve(userId);

  if (!member) {
    await message.react(util.icons.error);
    await message.channel.send("User not found or not in guild!");
    return;
  }

  if (member.user.bot) {
    await message.react(util.icons.error);
    await message.channel.send("You cant interact with bots!");
    return;
  }

  //highest role check
  if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
    await message.react(util.icons.error);
    await message.channel.send("You dont have the Permission to softban that Member!");
    return;
  }

  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator, active) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'softban', now, reason, message.author.id,false]);

  await member.send(`You were softbanned from \`${message.guild.name}\` | ${reason}`);
  await message.guild.members.ban(userId,`${message.author.username}#${message.author.discriminator}: `+reason);
  await message.guild.members.unban(userId,`softban`);

  const responseEmbed = new Discord.MessageEmbed()
  .setDescription(`**${member.user.username}#${member.user.discriminator} has been softbanned | ${reason}**`)
  .setColor(0x1FD78D)
  await message.channel.send(responseEmbed);
  const embed = new Discord.MessageEmbed()
  .setColor(0xF62451)
  .setAuthor(`Case ${insert.insertId} | Softban | ${member.user.username}#${member.user.discriminator}`, `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=256`)
  .addFields(
    { name: "User", value: `<@${member.user.id}>`, inline: true},
    { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
    { name: "Reason", value: reason, inline: true}
  )
  .setFooter(`ID: ${member.user.id}`)
  await util.logMessageEmbed(message, "", embed);
}

exports.names = ['softban'];
