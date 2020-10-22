const util = require('../../lib/util.js');
const Discord = require('discord.js');

let ignore = new Discord.Collection();
const cache = 30*1000;
exports.event = async (options, message) => {
  if (!message.guild || message.author.bot || ignore.has(message.id)) {
    return;
  }

  let content = message.content.substring(0,2048);
  for (const [,attachment] of message.attachments) {
    if (content.length + attachment.url.length > 2048) {break;}
    content += ` ${attachment.url}`;
  }
  let embed;
  if (message.system) {
    embed = new Discord.MessageEmbed()
        .setColor(util.color.red)
        .setAuthor(`A system message in #${message.channel.name} was deleted`);
  }
  else if(content.length === 0) {
    embed = new Discord.MessageEmbed()
        .setColor(util.color.red)
        .setAuthor(`Empty message by ${message.author.username}#${message.author.discriminator} in #${message.channel.name} was deleted`,message.author.avatarURL())
        .setFooter(`ID: ${message.author.id}`);
  }
  else{
    embed = new Discord.MessageEmbed()
        .setColor(util.color.red)
        .setAuthor(`Message by ${message.author.username}#${message.author.discriminator} in #${message.channel.name} was deleted`,message.author.avatarURL())
        .setDescription(content)
        .setFooter(`ID: ${message.author.id}`);
  }

  await util.logMessageEmbed(message, '', embed);
};

exports.ignore = (id) => {
  ignore.set(id, Date.now());
};

exports.purgeCache = () => {
  ignore = ignore.filter(timestamp => timestamp > Date.now() + cache);
};
