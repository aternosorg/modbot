const util = require('../lib/util.js');

const command = {};

command.description = 'Unmute a user';

command.usage = '@user|id <@user|id…> <reason>';

command.names = ['unmute'];

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
    let user= await bot.users.fetch(userId);

    let member;
    try {
      member = await message.guild.members.fetch(userId);
    } catch (e) {}
    let guildConfig = await util.getGuildConfig(message);

    if (user.bot) {
      await message.react(util.icons.error);
      await message.channel.send("You can't interact with bots!");
      continue;
    }

    if(!await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]) && (member && !member.roles.cache.has(guildConfig.mutedRole))) {
      await message.react(util.icons.error);
      await message.channel.send(`<@${member.id}> isn't muted here!`);
      continue;
    }

    let now = Math.floor(Date.now()/1000);

    if (member) {
      await member.roles.remove([guildConfig.mutedRole], `${message.author.username}#${message.author.discriminator} | ` + reason);
    }
    await database.query("UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = 'mute'", [message.guild.id, userId]);
    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator, active) VALUES (?,?,?,?,?,?,?)",[message.guild.id, userId,'unmute', now, reason, message.author.id, false]);

    if (member) {
      try {
        await member.send(`You were unmuted in \`${message.guild.name}\` | ${reason}`);
      } catch (e) {}
    }

    await util.chatSuccess(message.channel, user, reason, "unmuted");
    await util.logMessageModeration(message.guild.id, message.author, user, reason, insert.insertId, "Unmute");

  }

};

module.exports = command;
