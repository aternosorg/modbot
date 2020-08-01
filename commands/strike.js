const util = require('../lib/util.js');

const maxStrikesAtOnce = 5;

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let count = 1;
  try {
    await bot.users.fetch(util.userMentionToId(args[0]))
  } catch (e) {
    count = Math.abs(parseInt(args.shift()));
    if (count > maxStrikesAtOnce) {
      await message.channel.send(`You cant give more then ${maxStrikesAtOnce} strikes at once!`);
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
    await message.channel.send("You cant interact with bots!");
    return;
  }

  //highest role check
  let member;
  try {
    member = await message.guild.members.fetch(user);
    if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
      await message.react(util.icons.error);
      await message.channel.send("You dont have the Permission to strike that Member!");
      return;
    }
  } catch (e) {}

  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  //insert strike
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, value, created, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, user.id, 'strike', count, now, reason, message.author.id]);

  //count all strikes
  let total = await database.query("SELECT SUM(value) AS sum FROM moderations WHERE guildid = ? AND userid = ? AND (action = 'strike' OR action = 'pardon')",[message.guild.id, user.id]);
  total = parseInt(total.sum);

  if (member) {
    try {
      await member.send(`You recieved ${count} strikes in \`${message.guild.name}\` | ${reason}\nYou now have ${total} strikes`);
    } catch (e) {}
  }
  await util.chatSuccess(message.channel, user, reason, "striked")
  await util.logMessageModeration(message, message.author, user, reason, insert.insertId, "Strike", null, count, total);
  await punish(message, user, total, bot);
}

exports.names = ['strike'];

async function punish(message, user, total, bot) {
  let config = await util.getGuildConfig(message.guild);
  let punishment = config.punishments[total];
  let member;

  if(!punishment) {
    return;
  }

  switch (punishment.action) {
    case 'ban':
      let ban = require('./ban.js');
      await ban.ban(message.guild, user, bot.user, `Reaching ${total} strikes`, punishment.duration);
      break;
    case 'kick':
      try {
        member = await message.guild.members.fetch(user.id);
      } catch (e) {
        return;
      }
      let kick = require('./kick.js');
      await kick.kick(message.guild, member, bot.user, `Reaching ${total} strikes`);
      break;
    case 'mute':
      let mute = require('./mute.js');
      await mute.mute(message.guild, user, bot.user, `Reaching ${total} strikes`, punishment.duration);
      break;
    case 'softban':
      try {
        member = await message.guild.members.fetch(user.id);
      } catch (e) {
        return;
      }
      let softban = require('./softban.js');
      await softban.softban(message.guild, member, bot.user, `Reaching ${total} strikes`);
      break;

  }
}
