const util = require('../lib/util.js');

const command = {};

command.description = 'Ban a user';

command.usage = '@user|id <@user|id…> <duration> <reason>';

command.names = ['ban'];

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

  let duration = util.timeToSec(args.join(' '));

  while (util.isTime(args[0])){
    args.shift();
  }
  let reason = args.join(' ');

  for (let user of users) {
    user = await bot.users.fetch(util.userMentionToId(user));

    if (user.bot) {
      await message.react(util.icons.error);
      await message.channel.send("You can't interact with bots!");
      continue;
    }

    let member;
    try {
      member = await message.guild.members.resolve(user);
      //highest role & mod check
      if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)) {
        await message.react(util.icons.error);
        await message.channel.send(`You don't have the permission to ban <@${user.id}>!`);
        continue;
      }
    } catch (e) {}

    await command.ban(message.guild, user, message.author, reason, duration, message.channel);
  }
};

command.ban = async(guild, user, moderator, reason, duration, channel) => {
  reason = reason || 'No reason provided.';
  let time = util.secToTime(duration);

  try {
    if (duration) {
       await user.send(`You were banned from \`${guild.name}\` for ${time} | ${reason}`);
    }
    else {
      await user.send(`You were permanently banned from \`${guild.name}\` | ${reason}`);
    }
  } catch (e) {}

  if (duration) {
    await guild.members.ban(user.id, {days: 1, reason: `${moderator.username}#${moderator.discriminator} (${time}) | ` + reason});
  }
  else {
    await guild.members.ban(user.id, {days: 1, reason: `${moderator.username}#${moderator.discriminator} | ` + reason});
  }

  let insert = await util.moderationDBAdd(guild.id, user.id, "ban", reason, duration, moderator.id);
  if (channel) {
    await util.chatSuccess(channel, user, reason, "banned", time);
  }
  await util.logMessageModeration(guild.id, moderator, user, reason, insert, "Ban", time);
};

module.exports = command;
