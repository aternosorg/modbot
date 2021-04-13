const util = require('../../util.js');
const Log = require('../../Log');
const GuildConfig = require('../../GuildConfig');
const RateLimiter = require('../../RateLimiter');
const icons = require('../../icons');
const {APIErrors} = require('discord.js').Constants;

const command = {};

command.description = 'Kick a user';

command.usage = '@user|id <@user|id…> <reason>';

command.names = ['kick'];

command.execute = async (message, args, database, bot) => {
  /** @type {GuildConfig} */
  const guildconfig = await GuildConfig.get(message.guild.id);
  if(!await guildconfig.isMod(message.member) && !message.member.hasPermission('KICK_MEMBERS')) {
    await message.react(icons.error);
    return;
  }

  const users = await util.userMentions(args);

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
      if (e.code === APIErrors.UNKNOWN_MEMBER) {
        await message.react(icons.error);
        await message.channel.send("User not found or not in guild!");
        continue;
      }
      else {
        throw e;
      }
    }

    if (member.user.bot) {
      await message.react(icons.error);
      await message.channel.send("I can't interact with bots!");
      continue;
    }

    //highest role check
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || guildconfig.isProtected(member)){
      await message.react(icons.error);
      await message.channel.send(`You don't have the permission to kick <@${member.id}>!`);
      continue;
    }

    await command.kick(message.guild, member, message.author, reason, message.channel);
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
command.kick = async (guild, member, moderator, reason, channel) => {
  reason = reason || 'No reason provided.';

  let insert = await util.moderationDBAdd(guild.id, member.id, "kick", reason, null, moderator.id);

  try {
    await RateLimiter.sendDM(guild, member, `You were kicked from \`${guild.name}\` | ${reason}`);
  } catch (e) {
    if (e.code !== APIErrors.CANNOT_MESSAGE_USER) {
      throw e;
    }
  }
  await member.kick(`${moderator.username}#${moderator.discriminator} | `+reason);

  if (channel) {
    await util.chatSuccess(channel, member.user, reason, "kicked");
  }
  await Log.logModeration(guild.id, moderator, member.user, reason, insert, "Kick");
};

module.exports = command;
