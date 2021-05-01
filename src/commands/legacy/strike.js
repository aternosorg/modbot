const util = require('../../util.js');
const Member = require('../../Member');
const softban = require('./softban.js');
const GuildConfig = require('../../GuildConfig');
const Log = require('../../Log');
const RateLimiter = require('../../RateLimiter');
const icons = require('../../icons');
const {APIErrors} = require('discord.js').Constants;

const maxStrikesAtOnce = 5;

const command = {};

command.description = 'Strike a user';

command.usage = '<count> @user|id <@user|id…> <reason>';

command.names = ['strike'];

command.execute = async (message, args, database, bot) => {
  /** @type {GuildConfig} */
  const guildconfig = await GuildConfig.get(message.guild.id);
  if(!guildconfig.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(icons.error);
    return;
  }

  if (!args.length) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let count = 1;

  if (parseInt(args[0]) < 1000) {
    count = parseInt(args.shift());
    if (count > maxStrikesAtOnce) {
      await message.channel.send(`You can't give more than ${maxStrikesAtOnce} strikes at once!`);
      return;
    }
  }

  let users = await util.userMentions(args);

  if (!users.length) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  for (let userId of users) {
    /** @type {module:"discord.js".User} */
    const user = await bot.users.fetch(util.userMentionToId(userId));

    if (user.bot) {
      await message.react(icons.error);
      await message.channel.send("I can't interact with bots!");
      continue;
    }

    //highest role check
    let member;
    try {
      member = await message.guild.members.fetch(user);
      if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || guildconfig.isProtected(member)){
        await message.react(icons.error);
        await message.channel.send(`You don't have the permission to strike <@${member.id}>!`);
        continue;
      }
    } catch (e) {
      if (![APIErrors.UNKNOWN_MEMBER, APIErrors.MISSING_PERMISSIONS].includes(e.code)) {
        throw e;
      }
    }

    await command.add(message.guild, user, count, message.author, args.join(' '), message.channel, database, bot);
  }
};

/**
 *
 * @param {module:"discord.js".Guild}       guild
 * @param {module:"discord.js".User}        user
 * @param {Number}                          count
 * @param {module:"discord.js".User}        moderator
 * @param {String}                          reason
 * @param {module:"discord.js".TextChannel} channel
 * @param {Database}                        database
 * @param {module:"discord.js".Client}      bot
 * @return {Promise<void>}
 */
command.add = async (guild, user, count, moderator, reason, channel, database, bot) => {
  reason = reason || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);
  let member;

  //insert strike
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, value, created, reason, moderator) VALUES (?,?,?,?,?,?,?)",[guild.id, user.id, 'strike', count, now, reason, moderator.id]);

  //count all strikes
  let total = await database.query("SELECT SUM(value) AS sum FROM moderations WHERE guildid = ? AND userid = ? AND (action = 'strike' OR action = 'pardon')",[guild.id, user.id]);
  total = parseInt(total.sum);

  try {
    member = await guild.members.fetch(user);
    await RateLimiter.sendDM(guild, member, `You received ${count} ${count === 1 ? "strike" : "strikes"} in \`${guild.name}\` | ${reason}\nYou now have ${total} ${total === 1 ? "strike" : "strikes"}`);
  }
  catch (e){
    if (![APIErrors.UNKNOWN_MEMBER, APIErrors.CANNOT_MESSAGE_USER].includes(e.code)) {
      throw e;
    }
  }
  if (channel) {
    await util.chatSuccess(channel, user, reason, "striked");
  }
  await Log.logModeration(guild, moderator, user, reason, insert.insertId, "Strike", {amount: count, total});
  await punish(guild, user, total, bot, database);
};

/**
 * @param {module:"discord.js".Guild}   guild
 * @param {module:"discord.js".User}    user
 * @param {Number}                      total
 * @param {module:"discord.js".Client}  bot
 * @param {Database}                    database
 * @return {Promise<void>}
 */
async function punish(guild, user, total, bot, database) {
  /** @type {GuildConfig} */
  let config = await GuildConfig.get(/** @type {module:"discord.js".Snowflake} */ guild.id);
  let punishment;
  let count = total;
  do {
    punishment = config.getPunishment(count);
    count --;
  } while (!punishment && count > 0);

  if (!punishment) return;

  await command.executePunishment(punishment, guild, user, bot, database,`Reaching ${total} ${total === 1 ? "strike" : "strikes"}`);
}

/**
 * @param {Punishment}                  punishment
 * @param {module:"discord.js".Guild}   guild
 * @param {module:"discord.js".User}    user
 * @param {module:"discord.js".Client}  bot
 * @param {Database}                    database
 * @param {String}                      reason
 * @return {Promise<void>}
 */
command.executePunishment = async (punishment, guild, user, bot, database, reason) => {
  if (typeof(punishment.duration) === 'string') {
    punishment.duration = util.timeToSec(punishment.duration);
  }

  let member;
  switch (punishment.action) {
    case 'ban':
      member = new Member(user, guild);
      await member.ban(database, reason, bot.user, punishment.duration);
      break;
    case 'kick':
      member = new Member(user, guild);
      await member.kick(database, reason, bot.user);
      break;
    case 'mute':
      member = new Member(user, guild);
      await member.mute(database, reason, bot.user, punishment.duration);
      break;
    case 'softban':
      try {
        member = await guild.members.fetch(user.id);
      }
      catch (e) {
        if (e.code === APIErrors.UNKNOWN_MEMBER) {
          return;
        }
        else {
          throw e;
        }
      }
      await softban.softban(guild, member, bot.user, reason);
      break;

    //punishments that cant be strike punishments
    case 'strike':
      await command.add(guild,user, 1, bot.user, reason, null, database, bot);
      break;

    case 'dm':
      try {
        if (!punishment.message || punishment.message.length === 0) return;
        await RateLimiter.sendDM(guild, user, `Your message in \`${guild.name}\` was removed: ` + punishment.message);
      }
      catch (e) {
        if (![APIErrors.CANNOT_MESSAGE_USER].includes(e.code)) {
          throw e;
        }
      }
      break;

    default:
      throw `Unknown punishment action ${punishment.action}`;
  }
}

module.exports = command;
