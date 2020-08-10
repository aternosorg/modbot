const util = require('../lib/util.js');

const command = {};

command.description = 'Uban a user';

command.usage = '@user|userId <reason>';

command.names = ['unban'];

command.execute = async (message, args, database, bot) => {
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

  if (user.bot) {
    await message.react(util.icons.error);
    await message.channel.send("You can't interact with bots!");
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

  await util.chatSuccess(message.channel, user, reason, "unbanned");
  await util.logMessageModeration(message.guild.id, message.author, user, reason, insert.insertId, "Unban");
};

module.exports = command;
