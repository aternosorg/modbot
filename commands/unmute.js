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

  let user;
  try {
    user = await bot.users.fetch(userId);
  } catch (e) {
    await message.react(util.icons.error);
    await message.channel.send("User not found!");
    return;
  }
  let member
  try {
      member = await message.guild.members.fetch(userId);
  } catch (e) {}
  let guildConfig = await util.getGuildConfig(message);

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
    await member.roles.remove([guildConfig.mutedRole], `${message.author.username}#${message.author.discriminator} | ` + reason);
  }
  await database.query("UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId])
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator, active) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId,'unmute', now, reason, message.author.id, false]);

  if (member) {
    try {
      await member.send(`You were unmuted in \`${message.guild.name}\` | ${reason}`);
    } catch (e) {}
  }

  await util.chatSuccess(message, message, user, reason, "unmuted");
  await util.logMessageModeration(message, message, user, reason, insert, "Unmute");
}

exports.names = ['unmute'];
