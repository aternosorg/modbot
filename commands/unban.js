const util = require('../lib/util.js');
const Discord = require('discord.js');

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    await message.react(util.icons.error);
    await message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }
  let user = await bot.users.fetch(userId);

  if (!user) {
    await message.react(util.icons.error);
    await message.channel.send("User not found!");
    return;
  }

  if (user.bot) {
    await message.react(util.icons.error);
    await message.channel.send("You cant interact with bots!");
    return;
  }

  let ban;
  try {
    ban = await message.guild.fetchBan(userId);
  } catch (e) {

  }
  if(!await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId]) && !ban) {
    await message.react(util.icons.error);
    await message.channel.send("User isn't banned here!");
    return;
  }

  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  if (ban) {
    await message.guild.members.unban(userId, `${message.author.username}#${message.author.discriminator} | ` + reason);
  }

  await database.query("UPDATE moderations SET active = FALSE WHERE action = 'ban' AND userid = ? AND guildid = ?",[userId,message.guild.guildid]);
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator, active) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'unban', now, reason, message.author.id, false]);

  const responseEmbed = new Discord.MessageEmbed()
  .setDescription(`**${user.username}#${user.discriminator} has been unbanned | ${reason}**`)
  .setColor(0x1FD78D)
  await message.channel.send(responseEmbed);
  const embed = new Discord.MessageEmbed()
  .setColor(0x1FD78D)
  .setAuthor(`Case ${insert.insertId} | Unban | ${user.username}#${user.discriminator}`, user.avatarURL())
  .addFields(
    { name: "User", value: `<@${user.id}>`, inline: true},
    { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
    { name: "Reason", value: reason, inline: true}
  )
  .setFooter(`ID: ${user.id}`)
  .setTimestamp()
  await util.logMessageEmbed(message, "", embed);
}

exports.names = ['unban'];
