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
     { name: "Command", value: "`help`\narticle\n`ban`\nhelpcenter\n`import`\nip\n`ipcooldown`\nkick\n`logchannel`\nmoderations\n`modroles`\nmute\n`mutedrole`\npardon\n`ping`\nplaylist\n`punish`\nsoftban\n`strike`\ntutorial\n`unban`\nunmute\n`userinfo`", inline: true},
     { name: "Description", value: "`Shows this help menu`\nQueries the given keyword and returns a fitting help article\n`Bans the given user`\nSets the zendesk for the article command\n`Imports a database from vortex you can acquire with >>export`\nSet channels which IPs are required/forbidden in, or turn it off\n`Set the cooldown on server IPs serverwide`\nKicks the given user from the server\n`Sets the channel to log moderations and message deletions to`\nShows the moderation logs of the given user\n`Sets or removes roles which can use moderator commands`\nMutes the given user\n`Sets the muted role`\nPardon up to 5 strikes from the given user\n`Shows the bot ping and websocket latency`\nSets which playlist to use for the video / tutorial command\n`Sets punishment at set strike amount`\nBans and instantly unbans the given user\n`Strikes the given user`\nQueries the given keyword and returns a fitting video\n`Unbans the given user`\nUnmutes the given user\n`Shows information about the given user`", inline: true},
     { name: "Syntax", value: "`help`\n`article {keyword}`\n`ban {user} {duration} {reason}`\n`helpcenter {zendesk subdomain}`\n`import`\n`ip {require/forbid/off} {channel}`\n`ipcooldown {duration}`\n`kick {user} {reason}`\n`logchannel {channel}`\n`moderations {user}`\n`modroles {add/remove/list} {role}`\n`mute {user} {duration} {reason}`", inline: false},
     { name: "Syntax", value: "`mutedrole {role}`\n`pardon {case}`\n`ping`\n`playlist {yt playlist link}`\n`punish {strikes} {punishment}`\n`softban {user} {reason}`\n`strike {amount} {user} {reason}`\n`tutorial/video {keyword}`\n`unban {user}`\n`unmute {user}`\n`userinfo/check {user}`", inline: true}
 );
 message.channel.send(embed);

};

command.names = ['help'];

module.exports = command;
