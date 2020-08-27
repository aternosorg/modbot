const util = require('../../lib/util.js');
const Discord = require('discord.js');
const jsdiff = require('diff');

exports.event = async (database, old, newMsg) => {
  if (old.author.bot) {
    return;
  }
  if (old.content === newMsg.content) {
    return;
  }

  let diff = jsdiff.diffWords(old.content, newMsg.content);

  let formatted = '';
  for (let part of diff) {
    if (part.added) {
      formatted += `__${part.value}__`;
    }
    else if (part.removed) {
      formatted += `~~${part.value}~~ `;
    }
    else {
      formatted += part.value;
    }
  }

  let embed = new Discord.MessageEmbed()
    .setColor(util.color.orange)
    .setAuthor(`Message by ${old.author.username}#${old.author.discriminator} in #${old.channel.name} was edited`,old.author.avatarURL())
    .setDescription(
      'Changes: ' + formatted.substring(0,1991)
    )
    .setFooter(`ID: ${old.author.id}`);

  await util.logMessageEmbed(old, '', embed);
};
