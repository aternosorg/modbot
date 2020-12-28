const util = require('../util.js');
const Discord = require('discord.js');

/**
 * timeout after last reaction in ms
 * @type {number}
 */
const reactionTimeout = 60000;

const command = {};

command.description = 'List all moderations for a user';

command.usage = '<@user|userId>';

command.names = ['moderations','modlog','modlogs'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('VIEW_AUDIT_LOG')) {
    await message.react(util.icons.error);
    return;
  }

  const userId = util.userMentionToId(args.shift());
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

  /** @type {ModerationData[]} */
  const moderations = await database.queryAll("SELECT id, action, created, value, expireTime - created AS duration, reason, moderator FROM moderations WHERE userid = ? AND guildid = ?",[userId,message.guild.id]);

  if (moderations.length === 0) {
    const embed = new Discord.MessageEmbed({
      author: {
        name: `Moderations for ${user.username}#${user.discriminator}`,
        iconURL: user.avatarURL()
      },
      description: 'This user doesn\'t have any moderations!'
    });
    await message.channel.send(embed);
    return;
  }

  let index = 0, lastModified = Date.now();
  /** @type {module:"discord.js".Message} */
  const response = await message.channel.send(generateEmbed(moderations,user,0));

  if (moderations.length <= 10) return;

  await response.react(util.icons.left)
  await response.react(util.icons.right)

  const reactionCollector = response.createReactionCollector(async (reaction, reactingUser) => {
    if (message.author.id === reactingUser.id && [util.icons.left,util.icons.right].includes(reaction.emoji.name))
      return true;
    else {
      await reaction.users.remove(reactingUser);
      return false;
    }
  })

  reactionCollector.on('collect', async (reaction, reactingUser) => {
    if (reaction.emoji.name === util.icons.right) {
      if (index < Math.floor(moderations.length / 10)) {
        index++;
        await response.edit(generateEmbed(moderations, user, index*10));
      }
    }
    else {
      if (index > 0) {
        index--;
        await response.edit(generateEmbed(moderations, user, index*10));
      }
    }
    await reaction.users.remove(reactingUser);
    lastModified = Date.now();
  });

  function check () {
    if (Date.now() > (lastModified + reactionTimeout)) {
      reactionCollector.stop("TIME");
      response.reactions.removeAll();
    }
    else {
      timeout = setTimeout(check, lastModified + reactionTimeout - Date.now())
    }
  }

  let timeout = setTimeout(check,reactionTimeout)
};

/**
 * generate embed with up to 10 moderations
 * @param {ModerationData[]}          moderations
 * @param {module:"discord.js".User}  user  who's moderations are this?
 * @param {Number}                    start first moderation
 * @return {module:"discord.js".MessageEmbed}
 */
function generateEmbed(moderations, user, start) {
  let text = '', i = 1;
  for (const [key,/** @type {ModerationData} */ moderation] of moderations.entries()) {

    if (key < start) continue;
    if (i > 10) break;

    const timestamp = new Date(moderation.created*1000);
    text += `**${moderation.action.toUpperCase()}** [#${moderation.id}] - *${timestamp.toUTCString()}*\n`;
    if (moderation.action === 'strike') {
      text += `Strikes: ${moderation.value} \n`;
    }
    else if (moderation.action === 'pardon') {
      text += `Pardoned strikes: ${-moderation.value} \n`;
    }
    if (moderation.duration) {
      text += `Duration: ${util.secToTime(moderation.duration)} \n`;
    }
    if (moderation.moderator) {
      text += `Moderator: <@!${moderation.moderator}> \n`;
    }
    text += `Reason: ${moderation.reason.substring(0, 90)} \n\n`;
    i++;
  }
  return new Discord.MessageEmbed({
    author: {
      name: `Moderations for ${user.username}#${user.discriminator} (${start + 1} to ${start + 10 > moderations.length ? moderations.length : start + 10} of ${moderations.length})`,
      iconURL: user.avatarURL()
    },
    description: text
  });
}

module.exports = command;
