const util = require('../lib/util.js');
const ban = require('./ban.js');
const kick = require('./kick.js');
const mute = require('./mute.js');
const softban = require('./softban.js');

const maxStrikesAtOnce = 5;

const command = {};

command.description = 'Strike a user';

command.usage = '<count> @user|userId <reason>';

command.names = ['strike'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let count = 1;
  try {
    await bot.users.fetch(util.userMentionToId(args[0]));
  } catch (e) {
    count = Math.abs(parseInt(args.shift()));
    if (count > maxStrikesAtOnce) {
      await message.channel.send(`You can't give more than ${maxStrikesAtOnce} strikes at once!`);
      return;
    }
  }

  let user;
  try {
    user = await bot.users.fetch(util.userMentionToId(args.shift()));
  } catch (e) {
    await message.react(util.icons.error);
    await message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }

  if (user.bot) {
    await message.react(util.icons.error);
    await message.channel.send("You can't interact with bots!");
    return;
  }

  //highest role check
  let member;
  try {
    member = await message.guild.members.fetch(user);
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
      await message.react(util.icons.error);
      await message.channel.send("You don't have the permission to strike that member!");
      return;
    }
  } catch (e) {}

  await command.add(message.guild, user, count, message.author, args.join(' '), message.channel, database, bot);
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
  await util.logMessageModeration(guild, moderator, user, reason, insert.insertId, "Strike", null, count, total);
  await punish(guild, user, total, bot);
};

async function punish(guild, user, total, bot) {
  let config = await util.getGuildConfig(guild);
  let punishment, member;
  let count = total;
  do {
    punishment = config.punishments[count];
    count --;
  } while (!punishment && count > 0);

  if (!punishment) {
    return ;
  }

  switch (punishment.action) {
    case 'ban':
      await ban.ban(guild, user, bot.user, `Reaching ${total} strikes`, punishment.duration);
      break;
    case 'kick':
      try {
        member = await guild.members.fetch(user.id);
      } catch (e) {
        return;
      }
      await kick.kick(guild, member, bot.user, `Reaching ${total} strikes`);
      break;
    case 'mute':
      await mute.mute(guild, user, bot.user, `Reaching ${total} strikes`, punishment.duration);
      break;
    case 'softban':
      try {
        member = await guild.members.fetch(user.id);
      } catch (e) {
        return;
      }
      await softban.softban(guild, member, bot.user, `Reaching ${total} strikes`);
      break;
  }
}

module.exports = command;
