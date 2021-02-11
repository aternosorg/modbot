const util = require('../../util.js');
const Log = require('../../Log');
const GuildConfig = require('../../GuildConfig');
const RateLimiter = require('../../RateLimiter');

const command = {};

command.description = 'Softban a user (ban with immediate unban)';

command.usage = '@member|id <@member|id…> <reason>';

command.names = ['softban'];

command.execute = async (message, args, database, bot) => {
  /** @type {GuildConfig} */
  const guildconfig = await GuildConfig.get(message.guild.id);
  if(!guildconfig.isMod(message.member) && !message.member.hasPermission('KICK_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let users = await util.userMentions(args);

  if (!users.length) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let reason = args.join(' ');

  for (let userId of users) {
    let member;
    try {
      member = await message.guild.members.fetch(userId);
    } catch (e) {
      await message.react(util.icons.error);
      await message.channel.send("User not found or not in guild!");
      continue;
    }

    if (member.user.bot) {
      await message.react(util.icons.error);
      await message.channel.send("I can't interact with bots!");
      continue;
    }

    //highest role check
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || guildconfig.isProtected(member)){
      await message.react(util.icons.error);
      await message.channel.send("You don't have the permission to softban that member!");
      continue;
    }

    await command.softban(message.guild, member, message.author, reason, message.channel);
  }
};

/**
 *
 * @param {module:"discord.js".Guild}       guild
 * @param {module:"discord.js".GuildMember} member
 * @param {module:"discord.js".User}        moderator
 * @param {String}                          [reason]
 * @param {module:"discord.js".TextChannel} [channel]
 * @return {Promise<void>}
 */
command.softban = async (guild, member, moderator, reason, channel) => {
  reason = reason || 'No reason provided.';

  try {
    await RateLimiter.sendDM(guild, member, `You were softbanned from \`${guild.name}\` | ${reason}`);
  } catch (e) {}
  await guild.members.ban(member.id,{days: 1, reason: `${moderator.username}#${moderator.discriminator} | `+reason});
  await guild.members.unban(member.id,`Softban`);

  if (channel) {
    await util.chatSuccess(channel, member.user, reason, "softbanned");
  }
  let insert = await util.moderationDBAdd(guild.id, member.id, "softban", reason, null, moderator.id);
  await Log.logModeration(guild.id, moderator, member.user, reason, insert, "Softban");
};

module.exports = command;
