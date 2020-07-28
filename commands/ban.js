const util = require('../lib/util.js');

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

  let member
  //highest role & mod check
  if(message.guild.members.resolve(user)) {
    member = await message.guild.members.resolve(user);
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)) {
      await message.react(util.icons.error);
      await message.channel.send("You dont have the Permission to ban that Member!")
      return;
    }
  }

  let duration = util.timeToSec(args.join(' '));
  while (util.isTime(args[0]))
    args.shift();
  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  let ban = await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId]);
  //check user was already banned
  if (ban) {
    await database.query("UPDATE moderations SET active = FALSE WHERE guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId])
  }

  if (duration) {
    let time = util.secToTime(duration);
    let endsAt = now + duration;

    if (member) {
      await member.send(`You were banned from \`${message.guild.name}\` for ${time} | ${reason}`);
    }
    await message.guild.members.ban(userId, {days: 7, reason: `${message.author.username}#${message.author.discriminator} (${time}), Reason:` + reason});

    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'ban', now, endsAt, reason, message.author.id]);
    const responseEmbed = new Discord.MessageEmbed()
    .setDescription(`**${user.username}#${user.discriminator} has been banned for ${time} | ${reason}**`)
    .setColor(0x1FD78D)
    await message.channel.send(responseEmbed);
    const embed = new Discord.MessageEmbed()
    .setColor(0xF62451)
    .setAuthor(`Case ${insert.insertId} | Ban | ${user.username}#${user.discriminator}`, `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`)
    .addFields(
      { name: "User", value: `<@${user.id}>`, inline: true},
      { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
      { name: "Reason", value: reason, inline: true},
      { name: "Duration", value: `${time}`, inline: true}
    )
    .setFooter(`ID: ${user.id}`)
    await util.logMessageEmbed(message, "", embed);
  }
  else {
    if (member) {
      await member.send(`You were permanently banned from \`${message.guild.name}\` | ${reason}`);
    }
    await message.guild.members.ban(userId, {days: 7, reason: `${message.author.username}#${message.author.discriminator}, Reason: ` + reason});

    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[message.guild.id, userId, 'ban', now, reason, message.author.id]);

    const responseEmbed = new Discord.MessageEmbed()
    .setDescription(`**${user.username}#${user.discriminator} has been banned | ${reason}**`)
    .setColor(0x1FD78D)
    await message.channel.send(responseEmbed);
    const embed = new Discord.MessageEmbed()
    .setColor(0xF62451)
    .setAuthor(`Case ${insert.insertId} | Ban | ${user.username}#${user.discriminator}`, `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`)
    .addFields(
      { name: "User", value: `<@${user.id}>`, inline: true},
      { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
      { name: "Reason", value: reason, inline: true}
    )
    .setFooter(`ID: ${user.id}`)
    await util.logMessageEmbed(message, "", embed);
  }
}

exports.names = ['ban'];
