const util = require('../../lib/util.js');
const Discord = require('discord.js');

exports.event = async (database, old, newMsg) => {
  if (old.author.bot) {
    return;
  }
  if (old.content === newMsg.content) {
    return;
  }

  let embed = new Discord.MessageEmbed()
    .setColor(util.color.orange)
    .setAuthor(`Message by ${old.author.username}#${old.author.discriminator} in #${old.channel.name} was edited`,old.author.avatarURL())
    .addFields([
      {name: 'Before:', value: old.content.substring(0,1024)},
      {name: 'After:', value: newMsg.content.substring(0,1024)}
    ])
    .setFooter(`ID: ${old.author.id}`);

  await util.logMessageEmbed(old, '', embed);
};
