const util = require('../lib/util.js');

const command = {};

command.description = 'Unban a user';

command.usage = '@user|id <@user|id…> <reason>';

command.names = ['unban'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let users = await util.userMentions(args);

  if (!users.length) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let reason = args.join(' ') || 'No reason provided.';

  for(let userId of users) {
    let user = await bot.users.fetch(userId);

    if (user.bot) {
      await message.react(util.icons.error);
      await message.channel.send("You can't interact with bots!");
      continue;
    }

    let ban;
    try {
      ban = await message.guild.fetchBan(userId);
    } catch (e) {

    }
    if(!await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'ban'", [message.guild.id, userId]) && !ban) {
      await message.react(util.icons.error);
      await message.channel.send(`<@${user.id}> isn't banned here!`);
      continue;
    }
    let now = Math.floor(Date.now()/1000);

    if (ban) {
      await message.guild.members.unban(userId, `${message.author.username}#${message.author.discriminator} | ` + reason);
    }

    await database.query("UPDATE moderations SET active = FALSE WHERE action = 'ban' AND userid = ? AND guildid = ?",[userId,message.guild.guildid]);
    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator, active) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId, 'unban', now, reason, message.author.id, false]);

    await util.chatSuccess(message.channel, user, reason, "unbanned");
    await util.logMessageModeration(message.guild.id, message.author, user, reason, insert.insertId, "Unban");
  }
};

module.exports = command;
