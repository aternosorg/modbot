const util = require('../lib/util.js');
const Discord = require('discord.js');
const config = require('../config');

const command = {};

command.command = async (message, args, database, bot) => {
 const embed = new Discord.MessageEmbed()
   .setColor(util.color.green)
   .setAuthor(`Help Menu | Prefix: ${config.prefix}`)
   .setFooter(`Command executed by ${message.author.username}`)
   .setTimestamp()
   .addFields(
     { name: "Command", value: "`help` `article` `ban` `helpcenter`\n`import` `ip` `ipcooldown` `kick`\n`logchannel` `moderations` `modroles` `mute`\n`mutedrole` `pardon` `ping` `playlist`\n`punish` `softban` `strike` `tutorial`\n`unban` `unmute` `userinfo`", inline: true},
 );
 message.channel.send(embed);

};

command.names = ['help'];

module.exports = command;
