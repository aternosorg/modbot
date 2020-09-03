const util = require('../lib/util.js');
const Discord = require('discord.js');

const command = {};

command.description = 'List all moderations for a user';

command.usage = '@user|userId';

command.names = ['moderations','modlog','modlogs'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('VIEW_AUDIT_LOG')) {
    await message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let user;
  try {
    user = await bot.users.fetch(userId);
  } catch {
    await message.react(util.icons.error);
    await message.channel.send("User not found!");
    return;
  }

  let moderations = await database.queryAll("SELECT id, action, created, value, expireTime - created AS duration, reason, moderator FROM moderations WHERE userid = ? AND guildid = ?",[userId,message.guild.id]);

  if (moderations.length === 0) {
    let embed = new Discord.MessageEmbed({
      author: {
        name: `Moderations for ${user.username}#${user.discriminator}`,
        iconURL: user.avatarURL()
      },
      description: 'This user doesn\'t have any moderations!'
    });
    await message.channel.send(embed);
    return;
  }

  let text = '', i = 1;
  async function send(start, end) {
    let embed = new Discord.MessageEmbed({
      author: {
        name: `Moderations for ${user.username}#${user.discriminator} (${start} to ${end} of ${moderations.length})`,
        iconURL: user.avatarURL()
      },
      description: text
    });
    await message.channel.send(embed);
  }
  for (let [key,moderation] of moderations.entries()) {
    if (text.length > 1800) {
      await send(i, key);
      text = '';
      i = key + 1;
    }
    let timestamp = new Date(moderation.created*1000);
    text += `**${moderation.action.toUpperCase()}** [#${moderation.id}] - *${timestamp.toUTCString()}*\n`;
    if (moderation.action === 'strike') {
      text += `Strikes: ${moderation.value} \n`;
    }
    else if (moderation === 'pardon') {
      text += `Pardoned strikes: ${moderation.value} \n`;
    }
    if (moderation.duration) {
      text += `Duration: ${util.secToTime(moderation.duration)} \n`;
    }
    if (moderation.moderator) {
      text += `Moderator: <@!${moderation.moderator}> \n`;
    }
    text += `Reason: ${moderation.reason} \n\n`;
  }
  await send(i, moderations.length);
};

module.exports = command;
