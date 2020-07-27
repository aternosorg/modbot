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

  let user = await bot.users.fetch(userId);

  if (!user) {
    await message.react(util.icons.error);
    await message.channel.send("User not found!");
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

  let moderations = await database.query("SELECT COUNT(*) AS count FROM moderations WHERE userid = ? AND guildid = ?",[userId,message.guild.id]);
  moderations = parseInt(moderations.count);
  embed.setDescription(embed.description + `**Moderations:** ${moderations} \n`);

  let guildConfig = await util.getGuildConfig(message);
  let muteInfo = await database.query("SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = 'mute'",[userId,message.guild.id]);
  if (muteInfo) {
    if(muteInfo.expireTime)
      muteInfo = `${util.icons.yes} - ${muteInfo.reason} \n**Remaining:** ${util.secToTime(muteInfo.expireTime - Math.floor(Date.now()/1000))}`;
    else
      muteInfo = `${util.icons.yes} - ${muteInfo.reason}`;
  }
  else if (member && member.roles.cache.get(guildConfig.mutedRole)) {
    muteInfo = `${util.icons.yes} - unknown Reason and Timer`;
  }
  else {
    muteInfo = `${util.icons.no}`;
  }
  embed.setDescription(embed.description + `**Muted:** ${muteInfo} \n`);


  let banInfo = await database.query("SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = 'ban'",[userId,message.guild.id]);
  if (banInfo) {
    if(banInfo.expireTime)
      banInfo = `${util.icons.yes} - ${banInfo.reason} \n**Remaining:** ${util.secToTime(banInfo.expireTime - Math.floor(Date.now()/1000))}`;
    else
      banInfo = `${util.icons.yes} - ${banInfo.reason}`;
    embed.setDescription(embed.description + `**Banned:** ${banInfo}`);
  }
  else {
    try {
      banInfo = await message.guild.fetchBan(userId);
      banInfo = `${util.icons.yes} - ${banInfo.reason}`;
      embed.setDescription(embed.description + `**Banned:** ${banInfo}`);
    } catch (e) {
      embed.setDescription(embed.description + `**Banned:** ${util.icons.no}`);
    }
  }
  await message.channel.send(embed);
}

exports.names = ['userinfo','user','check'];
