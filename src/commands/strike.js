const util = require('../util.js');
const ban = require('./ban.js');
const kick = require('./kick.js');
const mute = require('./mute.js');
const softban = require('./softban.js');
const GuildConfig = require('../GuildConfig');
const Log = require('../Log');

const maxStrikesAtOnce = 5;

const command = {};

command.description = 'Strike a user';

command.usage = '<count> @user|id <@user|id…> <reason>';

command.names = ['strike'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
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
    let user;
    try {
      user = await bot.users.fetch(util.userMentionToId(userId));
    } catch (e) {}

    if (user.bot) {
      await message.react(util.icons.error);
      await message.channel.send("I can't interact with bots!");
      continue;
    }

    //highest role check
    let member;
    try {
      member = await message.guild.members.fetch(user);
      if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
        await message.react(util.icons.error);
        await message.channel.send(`You don't have the permission to strike <@${member.id}>!`);
        continue;
      }
    } catch (e) {}

    await command.add(message.guild, user, count, message.author, args.join(' '), message.channel, database, bot);
  }
};

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
    await member.send(`You received ${count} ${count === 1 ? "strike" : "strikes"} in \`${guild.name}\` | ${reason}\nYou now have ${total} ${total === 1 ? "strike" : "strikes"}`);
  } catch{}
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
  let config = await GuildConfig.get(guild.id);
  let punishment;
  let count = total;
  do {
    punishment = config.punishments[count];
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
      await ban.ban(guild, user, bot.user, reason, punishment.duration);
      break;
    case 'kick':
      try {
        member = await guild.members.fetch(user.id);
      } catch (e) {
        return;
      }
      await kick.kick(guild, member, bot.user, reason);
      break;
    case 'mute':
      await mute.mute(guild, user, bot.user, reason, punishment.duration);
      break;
    case 'softban':
      try {
        member = await guild.members.fetch(user.id);
      } catch (e) {
        return;
      }
      await softban.softban(guild, member, bot.user, reason);
      break;

    case 'strike':
      await command.add(guild,user, 1, bot.user, reason, null, database, bot);
      break;
  }
}

module.exports = command;
