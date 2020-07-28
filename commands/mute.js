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
  let member = await message.guild.members.resolve(userId);

  //highest role check
  if(member && (message.member.roles.highest.comparePositionTo(message.guild.members.resolve(userId).roles.highest) <= 0 || await util.isMod(member))) {
    await message.react(util.icons.error);
    await message.channel.send("You dont have the permission to mute that member!");
    return;
  }

  let config = await util.getGuildConfig(message.guild.id);
  let mutedRole = config.mutedRole;
  if (!mutedRole) {
      await message.channel.send("No muted role specified!");
      return;
  }

  let duration = util.timeToSec(args.join(' '));
  while (util.isTime(args[0]))
    args.shift();
  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  let mute = await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]);
  //check user was already muted
  if (mute) {
    await database.query("UPDATE moderations SET active = false WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]);
  }

  if (duration) {
    let time = util.secToTime(duration);
    let endsAt = now + duration;
    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'mute', now, endsAt, reason, message.author.id]);

    if(member) {
      await member.roles.add(mutedRole, `${message.author.username}#${message.author.discriminator} (${time}), Reason: ` + reason);
      await member.send(`You were muted in \`${message.guild.name}\` for ${time} | ${reason}`);
    }

    const responseEmbed = new Discord.MessageEmbed()
    .setDescription(`**${user.username}#${user.discriminator} has been muted for ${time} | ${reason}**`)
    .setColor(0x1FD78D)
    await message.channel.send(responseEmbed);
    const embed = new Discord.MessageEmbed()
    .setColor(0xEB7B59)
    .setAuthor(`Case ${insert.insertId} | Mute | ${member.user.username}#${member.user.discriminator}`, member.user.avatarURL())
    .addFields(
      { name: "User", value: `<@${member.user.id}>`, inline: true},
      { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
      { name: "Reason", value: reason, inline: true},
      { name: "Duration", value: `${time}`, inline: true}
    )
    .setFooter(`ID: ${user.id}`)
    await util.logMessageEmbed(message, "", embed);
  }
  else {
    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[message.guild.id, userId, 'mute', now, reason, message.author.id]);

    if (member) {
      await member.roles.add(mutedRole, `${message.author.username}#${message.author.discriminator} | `+reason);
      await member.send(`You were permanently muted in \`${message.guild.name}\` | ${reason}`);
    }

    const responseEmbed = new Discord.MessageEmbed()
    .setDescription(`**${user.username}#${user.discriminator} has been muted | ${reason}**`)
    .setColor(0x1FD78D)
    await message.channel.send(responseEmbed);
    const embed = new Discord.MessageEmbed()
    .setColor(0xEB7B59)
    .setAuthor(`Case ${insert.insertId} | Mute | ${user.username}#${user.discriminator}`, user.avatarURL())
    .addFields(
      { name: "User", value: `<@${user.id}>`, inline: true},
      { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
      { name: "Reason", value: reason, inline: true}
    )
    .setFooter(`ID: ${user.id}`)
    await util.logMessageEmbed(message, "", embed);
  }
}

exports.names = ['mute'];
