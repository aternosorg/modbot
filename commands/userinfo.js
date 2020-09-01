const util = require('../lib/util.js');
const Discord = require('discord.js');

const command = {};

command.description = 'Show information about a user';

command.usage = '@user|userId';

command.names = ['userinfo','user','check'];

command.execute = async (message, args, database, bot) => {
  if(!await util.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(util.icons.error);
    return;
  }

  let userId = util.userMentionToId(args.shift());
  if (!userId) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  let user;
  try {
    user = await bot.users.fetch(userId);
  } catch (e) {
    await message.react(util.icons.error);
    await message.channel.send("User not found!");
    return;
  }

  let member;
  try {
    member = await message.guild.members.resolve(userId);
  } catch (e) {}

  let embed = new Discord.MessageEmbed({
      description: ``
  });

  embed.setAuthor(`Userinfo for ${user.username}#${user.discriminator}`,user.avatarURL());

  embed.setDescription(embed.description + `**ID:** ${userId} \n`);
  embed.setDescription(embed.description + `**Created Account:** ${user.createdAt.toDateString()} \n`);
  if (member && member.joinedAt) {
    embed.setDescription(embed.description + `**Joined Guild:** ${member.joinedAt.toDateString()} \n`);
  }

  let moderations = await database.query("SELECT COUNT(*) AS count FROM moderations WHERE userid = ? AND guildid = ?",[userId,message.guild.id]);
  moderations = parseInt(moderations.count);
  embed.setDescription(embed.description + `**Moderations:** ${moderations} \n`);

  let strikes = await database.query("SELECT SUM(value) AS sum FROM moderations WHERE guildid = ? AND userid = ? AND (action = 'strike' OR action = 'pardon')",[message.guild.id, user.id]);
  strikes = parseInt(strikes.sum);
  embed.setDescription(embed.description + `**Strikes:** ${strikes || 0} \n`);

  let guildConfig = await util.getGuildConfig(message);
  let muteInfo = await database.query("SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = 'mute'",[userId,message.guild.id]);
  if (muteInfo) {
    if(muteInfo.expireTime) {
      let remaining = muteInfo.expireTime - Math.floor(Date.now()/1000) > 0 ? muteInfo.expireTime - Math.floor(Date.now()/1000) : 1;
      muteInfo = `${util.icons.yes} - ${muteInfo.reason} \n**Remaining:** ${util.secToTime(remaining)}`;
    }
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
    if(banInfo.expireTime) {
      let remaining = banInfo.expireTime - Math.floor(Date.now()/1000) > 0 ? banInfo.expireTime - Math.floor(Date.now()/1000) : 1;
      banInfo = `${util.icons.yes} - ${banInfo.reason} \n**Remaining:** ${util.secToTime(remaining)}`;
    }
    else
      banInfo = `${util.icons.yes} - ${banInfo.reason}`;
    embed.setDescription(embed.description + `**Banned:** ${banInfo}`);
  }
  else {
    try {
      banInfo = await message.guild.fetchBan(userId);
      banInfo = `${util.icons.yes} - ${decodeURIComponent(banInfo.reason)}`;
      embed.setDescription(embed.description + `**Banned:** ${banInfo}`);
    } catch (e) {
      embed.setDescription(embed.description + `**Banned:** ${util.icons.no}`);
    }
  }
  await message.channel.send(embed);
};

module.exports = command;
