const util = require('../../util.js');
const Log = require('../../Log');
const GuildConfig = require('../../GuildConfig');
const RateLimiter = require('../../RateLimiter');
const icons = require('../../icons');
const command = {};
const {APIErrors} = require('discord.js').Constants;

command.description = 'Mute a user';

command.usage = '@user|id <@user|id…> <duration> <reason>';

command.names = ['mute'];

command.execute = async (message, args, database, bot) => {
  /** @type {GuildConfig} */
  const guildconfig = await GuildConfig.get(message.guild.id);
  if(!guildconfig.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(icons.error);
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

  for (let userId of users) {
    let user = await bot.users.fetch(userId);

    if (user.bot) {
      await message.react(icons.error);
      await message.channel.send("I can't interact with bots!");
      continue;
    }
    let member;
    try {
      member = await message.guild.members.fetch(userId);
    }
    catch (e) {
      if (![APIErrors.UNKNOWN_MEMBER, APIErrors.UNKNOWN_USER].includes(e.code)) {
        throw e;
      }
    }

    //highest role check
    if(member && (message.member.roles.highest.comparePositionTo((await message.guild.members.fetch(userId)).roles.highest) <= 0 || guildconfig.isProtected(member))) {
      await message.react(icons.error);
      await message.channel.send(`You don't have the permission to mute <@${member.id}>!`);
      continue;
    }

    await command.mute(message.guild, user, message.author, reason, duration, message.channel);
  }
};

/**
 *
 * @param {module:"discord.js".Guild}       guild
 * @param {module:"discord.js".User}        user
 * @param {module:"discord.js".User}        moderator
 * @param {String}                          [reason]
 * @param {Number}                          [duration]
 * @param {module:"discord.js".TextChannel} [channel]
 * @return {Promise<void>}
 */
command.mute = async (guild, user, moderator, reason, duration, channel) => {
  reason = reason || 'No reason provided.';
  let time = util.secToTime(duration);

  let config = await GuildConfig.get(guild.id);
  let mutedRole = config.mutedRole;
  if (!mutedRole) {
    if (channel) {
      await channel.send("No muted role specified!");
    }
    return;
  }

  try {
    let member = await guild.members.fetch(user.id);
    let text;
    if (duration) {
      await member.roles.add(mutedRole, `${moderator.username}#${moderator.discriminator} (${time}) | ` + reason);
      text = `You were muted in \`${guild.name}\` for ${time} | ${reason}`;
    }
    else {
      await member.roles.add(mutedRole, `${moderator.username}#${moderator.discriminator} | `+reason);
      text = `You were permanently muted in \`${guild.name}\` | ${reason}`;
    }
    await RateLimiter.sendDM(guild, member, text);
  } catch (e) {
    if (APIErrors.MISSING_PERMISSIONS === e.code) {
      if (channel) {
        await channel.send('I am missing the required permissions to perform this command!')
      }
    }
    else if (![APIErrors.UNKNOWN_MEMBER, APIErrors.UNKNOWN_USER, APIErrors.CANNOT_MESSAGE_USER, APIErrors.MISSING_PERMISSIONS, ].includes(e.code)) {
      throw e;
    }
  }

  let insert = await util.moderationDBAdd(guild.id, user.id, "mute", reason, duration, moderator.id);
  if (channel) {
    await util.chatSuccess(channel, user, reason, "muted", time);
  }
  await Log.logModeration(guild.id, moderator, user, reason, insert, "Mute", {time});
};

module.exports = command;
