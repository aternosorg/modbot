const util = require('../lib/util.js');
const Discord = require('discord.js');

exports.command = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    await message.react(util.icons.error);
    await message.channel.send("Please provide a user (@Mention or ID)!");
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

  let text = '', i = 1;
  for (let [key,moderation] of moderations.entries()) {
    if (text.length > 1800) {
      let embed = new Discord.MessageEmbed({
        author: {
          name: `Moderations for ${user.username}#${user.discriminator} (${i}-${key} of ${moderations.length})`,
          iconURL: user.avatarURL()
        },
        description: text
      });
      await message.channel.send(embed);
      text = '';
      i = key + 1;
    }
    let timestamp = new Date(moderation.created*1000);
    text += `**Case ${moderation.id}** | **${moderation.action}** | ${timestamp.toUTCString()}\n`;
    if (moderation.action === 'strike') {
      text += `Strikes: ${moderation.value} \n`;
    }
    else if (moderation === 'pardon') {
      text += `Pardoned strikes: ${moderation.value} \n`;
    }
    if (moderation.duration) {
      text += `Duration: ${util.secToTime(moderation.duration)} \n`
    }
    if (moderation.moderator) {
      text += `Moderator: <@!${moderation.moderator}> \n`;
    }
    text += `Reason: ${moderation.reason} \n`;
  }
  let embed = new Discord.MessageEmbed({
    author: {
      name: `Moderations for ${user.username}#${user.discriminator} (${i}-${moderations.length} of ${moderations.length})`,
      iconURL: user.avatarURL()
    },
    description: text
  });
  embed.setDescription(text);
  await message.channel.send(embed);
}

exports.names = ['moderations','modlog','modlogs'];
