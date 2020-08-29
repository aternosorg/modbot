const util = require('../lib/util.js');

const maxStrikesAtOnce = 5;

const command = {};

command.description = 'Pardon strikes of a user';

command.usage = '<count> @user|id <@user|id…> <reason>';

command.names = ['pardon'];

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
      await message.channel.send(`You can't pardon more than ${maxStrikesAtOnce} strikes at once!`);
      return;
    }
  }

  let users = await util.userMentions(args);

  if (!users.length) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let reason = args.join(' ') || 'No reason provided.';

  for (let userId of users) {
    let user = await bot.users.fetch(util.userMentionToId(userId));

    if (user.bot) {
      await message.react(util.icons.error);
      await message.channel.send("You can't interact with bots!");
      continue;
    }

    //highest role check
    let member;
    try {
      member = await message.guild.members.fetch(user);
      if(message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 || await util.isMod(member)){
        await message.react(util.icons.error);
        await message.channel.send(`You don't have the permission to pardon strikes of <@${member.id}>!`);
        continue;
      }
    } catch (e) {}

    let now = Math.floor(Date.now()/1000);

    //count all strikes
    let total = await database.query("SELECT SUM(value) AS sum FROM moderations WHERE guildid = ? AND userid = ? AND (action = 'strike' OR action = 'pardon')",[message.guild.id, user.id]);
    total = parseInt(total.sum);
    if (total < count) {
      count = total;
    }
    //insert strike
    let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, value, created, reason, moderator) VALUES (?,?,?,?,?,?,?)",[message.guild.id, user.id, 'pardon', -count, now, reason, message.author.id]);

    total -= count;

    if (member) {
      try {
        await member.send(`${count} ${count === 1 ? "strike was" : "strikes were"} pardoned in \`${message.guild.name}\` | ${reason}\nYou now have ${total} ${total === 1 ? "strike" : "strikes"}`);
      } catch (e) {}
    }
    await util.chatSuccess(message.channel, user, reason, "pardoned");
    await util.logMessageModeration(message, message.author, user, reason, insert.insertId, "Pardon", null, count, total);
  }
};

module.exports = command;
