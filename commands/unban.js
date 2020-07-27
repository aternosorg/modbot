const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    message.react(util.icons.error);
    message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }
  let user = await bot.users.fetch(userId);

  if (!user) {
    message.react(util.icons.error);
    message.channel.send("User not found!");
    return;
  }

  let ban;
  try {
    ban = await message.guild.fetchBan(userId);
  } catch (e) {

  }
  if(!await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId]) && !ban) {
    message.react(util.icons.error);
    message.channel.send("User isn't banned here!");
    return;
  }

  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  message.guild.members.unban(userId, `${message.author.username}#${message.author.discriminator}: ` + reason);

  database.query("UPDATE moderations SET active = FALSE WHERE action = 'ban' AND userid = ? AND guildid = ?",[userId,message.guild.guildid]);
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[message.guild.id, userId, 'unban', now, reason, message.author.id]);

  message.channel.send(`Unbanned \`${user.username}#${user.discriminator}\`: ${reason}`);
  util.logMessage(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` unbanned \`${user.username}#${user.discriminator}\`: ${reason}`);
}

exports.names = ['unban'];
