const util = require('../lib/util.js');

const command = {};

command.command = async (message, args, database, bot) => {
 const embed = new Discord.MessageEmbed()
   .setColor(0x43b581)
   .setAuthor(`Help menu | prefix: !`)
   .setFooter(`Command executed by ${message.author.username}`)
   .setTimestamp()
   .addFields(
     { name: "Command", value: "`help`\n`article`\n`ban`\n`helpcenter`\n`import`\n`ip`\n`ipcooldown`\n`kick`\n`logchannel`\n`moderations`\n`modroles`\n`mute`\n`mutedrole`\n`pardon`\n`ping`\n`playlist`\n`punish`\n`softban`\n`strike`\n`tutorial`\n`unban`\n`unmute`\n`userinfo`", inline: true},
     { name: "Description", value: "Shows this help menu\nQueries the given keyword and returns a fitting help article\nBans the given user\nSets the zendesk for the article command\nImports a database from vortex you can acquire with >>export\nSet channels which IPs are required/forbidden in, or turn it off\nSet the cooldown on server IPs serverwide\nKicks the given user from the server\nSets the channel to log moderations and message deletions to\nShows the moderation logs of the given user\nSets or removes roles which can use moderator commands\nMutes the given user\nSets the muted role\nPardon up to 5 strikes from the given user\nShows the bot ping and websocket latency\nSets which playlist to use for the video / tutorial command\nSets punishment at set strike amount\nBans and instantly unbans the given user\nStrikes the given user\nQueries the given keyword and returns a fitting video\nUnbans the given user\nUnmutes the given user\nShows information about the given user", inline: true},
     { name: "Syntax", value: "`help`\n`article {keyword}`\n`ban {user} {duration} {reason}`\n`helpcenter {zendesk subdomain}`\n`import`\n`ip {require/forbid/off} {channel}`\n`ipcooldown {duration}`\n`kick {user} {reason}`\n`logchannel {channel}`\n`moderations {user}`\n`modroles {add/remove/list} {role}`\n`mute {user} {duration} {reason}`\n`mutedrole {role}`\n`pardon {case}`\n`ping`\n`playlist {yt playlist link}`\n`punish {strikes} {punishment}`\n`softban {user} {reason}`\n`strike {amount} {user} {reason}`\n`tutorial/video {keyword}`\n`unban {user}`\n`unmute {user}`\n`userinfo/check {user}`", inline: false},
 );
message.channel.send(embed)

}
command.names = ['help'];

module.exports = command;
