const util = require('../lib/util.js');

const command = {}

command.command = async (message, args, database, bot) => {
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
    await message.channel.send("You cant interact with bots!");
    return;
  }
  let member = await message.guild.members.fetch(userId);

  //highest role check
  if(member && (message.member.roles.highest.comparePositionTo(message.guild.members.resolve(userId).roles.highest) <= 0 || await util.isMod(member))) {
    await message.react(util.icons.error);
    await message.channel.send("You dont have the permission to mute that member!");
    return;
  }

  let duration = util.timeToSec(args.join(' '));
  while (util.isTime(args[0]))
    args.shift();

  command.mute(message.guild, user, message.author, args.join(' '), duration, message.channel)
}

command.mute = async (guild, user, moderator, reason, duration, channel) => {
  reason = reason || 'No reason provided.';
  let time = util.secToTime(duration);

  let config = await util.getGuildConfig(guild.id);
  let mutedRole = config.mutedRole;
  if (!mutedRole) {
      if (channel) {
        await channel.send("No muted role specified!");
      }
      return;
  }

  try {
    let member = await guild.members.fetch(user.id);
    if (duration) {
      await member.roles.add(mutedRole, `${moderator.username}#${moderator.discriminator} (${time}) | ` + reason);
      await member.send(`You were muted in \`${guild.name}\` for ${time} | ${reason}`);
    }
    else {
      await member.roles.add(mutedRole, `${moderator.username}#${moderator.discriminator} | `+reason);
      await member.send(`You were permanently muted in \`${guild.name}\` | ${reason}`);
    }
  } catch (e) {}

  let insert = await util.moderationDBAdd(guild.id, user.id, "mute", reason, duration, moderator.id);
  if (channel) {
    await util.chatSuccess(channel, user, reason, "muted", time);
  }
  await util.logMessageModeration(guild.id, moderator, user, reason, insert, "Mute", time);
}

command.names = ['mute'];

module.exports = command;
