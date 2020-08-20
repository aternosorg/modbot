const util = require('../../lib/util.js');
const Discord = require('discord.js');

let ignore = new Discord.Collection();
const cache = 30*1000;
exports.event = async (database, message) => {
  if (message.author.bot || ignore.has(message.id)) {
    return ;
  }
  let embed = new Discord.MessageEmbed()
    .setAuthor(`${message.author.username}#${message.author.discriminator}`,message.author.avatarURL())
    .setDescription(message.content.substring(0,2048))
    .setFooter(`ID: ${message.author.id}`);

  await util.logMessageEmbed(message, `Message by <@!${message.author.id}> deleted in <#${message.channel.id}>`, embed);
};

exports.ignore = (id) => {
  ignore.set(id, Date.now());
};

exports.purgeCache = () => {
  ignore = ignore.filter(timestamp => timestamp > Date.now() + cache);
  console.log(ignore.size);
};
