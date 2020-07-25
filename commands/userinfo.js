const util = require('../lib/util.js');
const Discord = require('discord.js');

exports.command = async (message, args, database, bot) => {

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    message.channel.send("Please provide a user (@Mention or ID)!");
    return;
  }

  let user = await bot.users.fetch(userId);

  if (!user) {
    message.react('🛑');
    message.channel.send("User not found!");
    return;
  }

  let member = await message.guild.members.resolve(userId);

  let embed = new Discord.MessageEmbed({
      description: ``
  });

  embed.setAuthor(`Userinfo for ${user.username}#${user.discriminator}`,user.avatarURL());

  embed.setDescription(embed.description + `**ID:** ${userId} \n`);
  embed.setDescription(embed.description + `**Created Account:** ${user.createdAt.toDateString()} \n`);
  if (member) {
    embed.setDescription(embed.description + `**Joined Guild:** ${member.joinedAt.toDateString()} \n`);
  }

  let activeModerations = await database.query("SELECT COUNT(*) AS count FROM activeModerations WHERE userid = ? AND guildid = ?",[userId,message.guild.id]);
  let inactiveModerations = await database.query("SELECT COUNT(*) AS count FROM inactiveModerations WHERE userid = ? AND guildid = ?",[userId,message.guild.id]);
  let moderations = parseInt(activeModerations.count) + parseInt(inactiveModerations.count);
  embed.setDescription(embed.description + `**Moderations:** ${moderations} \n`);

  let muteInfo = await database.query("SELECT * FROM activeModerations WHERE userid = ? AND guildid = ? AND action = 'mute'",[userId,message.guild.id]);
  if (muteInfo) {
    if(muteInfo.timed)
      muteInfo = `✅ - ${muteInfo.reason} \n**Remaining:** ${util.secToTime(muteInfo.value - Math.floor(Date.now()/1000))}`;
    else
      muteInfo = `✅ - ${muteInfo.reason}`;
  }
  else if (member && member.roles.cache.get(util.mutedRole(message))) {
    muteInfo = `✅ - unknown Reason and Timer`;
  }
  else {
    muteInfo = `❌`;
  }
  embed.setDescription(embed.description + `**Muted:** ${muteInfo} \n`);


  let banInfo = await database.query("SELECT * FROM activeModerations WHERE userid = ? AND guildid = ? AND action = 'ban'",[userId,message.guild.id]);
  if (banInfo) {
    if(banInfo.timed)
      banInfo = `✅ - ${banInfo.reason} \n**Remaining:** ${util.secToTime(banInfo.value - Math.floor(Date.now()/1000))}`;
    else
      banInfo = `✅ - ${banInfo.reason}`;
    embed.setDescription(embed.description + `**Banned:** ${banInfo}`);
  }
  else {
    try {
      banInfo = await message.guild.fetchBan(userId);
      banInfo = `✅ - ${banInfo.reason}`;
      embed.setDescription(embed.description + `**Banned:** ${banInfo}`);
    } catch (e) {
      embed.setDescription(embed.description + `**Banned:** ❌`);
    }
  }
  message.channel.send(embed);
}

exports.names = ['userinfo','user','check'];
