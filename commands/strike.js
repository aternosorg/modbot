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
  if (message.guild.members.resolve(user)) {
    member = message.guild.members.resolve(user);
  }
  if(member && message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
    await message.react(util.icons.error);
    await message.channel.send("You dont have the Permission to strike that Member!");
    return;
  }

  let reason = args.join(' ') || 'No reason provided.';
  let now = Math.floor(Date.now()/1000);

  //insert strike
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, value, created, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, user.id, 'strike', count, now, reason, message.author.id]);

  //count all strikes
  let total = await database.query("SELECT SUM(value) AS sum FROM moderations WHERE guildid = ? AND userid = ? AND (action = 'strike' OR action = 'pardon')",[message.guild.id, user.id]);
  total = parseInt(total.sum);

  await member.send(`You recieved ${count} strikes in \`${message.guild.name}\` | ${reason}\nYou now have ${total} strikes`);
  await message.channel.send(`Gave ${count} strikes to \`${member.user.username}#${member.user.discriminator}\`: ${reason}\nTotal: ${total} strikes`);
  await util.logMessage(message, `\`[${insert.insertId}]\` \`${message.author.username}#${message.author.discriminator}\` gave ${count} strikes to \`${member.user.username}#${member.user.discriminator}\`(ID: ${user.id})\nReason: ${reason}\nTotal: ${total} strikes`);
}

exports.names = ['strike'];

async function punish(message, user, total) {
  let config = await util.getGuildConfig(user.guild);
  let punishment = util.punishments[total];
  switch (punishment) {
    case 'ban':
      
      break;
    case 'kick':

      break;
    case 'mute':

      break;
    case 'softban':

      break;

  }
}
