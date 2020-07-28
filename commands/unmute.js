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
  let member = await message.guild.members.resolve(userId);
  let guildConfig = await util.getGuildConfig(message);

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

  if(!await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]) && (member && !member.roles.cache.has(guildConfig.mutedRole))) {
    await message.react(util.icons.error);
    await message.channel.send("User isn't muted here!");
    return;
  }

  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  if (member) {
    await member.roles.remove([guildConfig.mutedRole], `${message.author.username}#${message.author.discriminator}: ` + reason);
  }
  await database.query("UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId])
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[message.guild.id, userId,'unmute', now, reason, message.author.id]);

  await member.send(`You were unmuted in \`${message.guild.name}\` | ${reason}`);

  const responseEmbed = new Discord.MessageEmbed()
  .setDescription(`**${user.username}#${user.discriminator} has been unmuted | ${reason}**`)
  .setColor(0x1FD78D)
  await message.channel.send(responseEmbed);
  const embed = new Discord.MessageEmbed()
  .setColor(0x1FD78D)
  .setAuthor(`Case ${insert.insertId} | Unmute | ${user.username}#${user.discriminator}`, `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`)
  .addFields(
    { name: "User", value: `<@${user.id}>`, inline: true},
    { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
    { name: "Reason", value: reason, inline: true}
  )
  .setFooter(`ID: ${user.id}`)
  await util.logMessageEmbed(message, "", embed);
}

exports.names = ['unmute'];
