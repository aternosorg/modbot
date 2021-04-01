const util = require('../../util.js');
const Discord = require('discord.js');
const GuildConfig = require('../../GuildConfig');
const icons = require('../../icons');
const command = {};
const {APIErrors} = require('discord.js').Constants;

command.description = 'Show information about a user';

command.usage = '@user|userId';

command.names = ['userinfo','user','check'];

command.execute = async (message, args, database, bot) => {
  /** @type {GuildConfig} */
  const guildconfig = await GuildConfig.get(message.guild.id);
  if(!guildconfig.isMod(message.member) && !message.member.hasPermission('BAN_MEMBERS')) {
    await message.react(icons.error);
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
  }
  catch (e) {
    if (e.code === APIErrors.UNKNOWN_USER) {
      await message.react(icons.error);
      await message.channel.send("User not found!");
      return;
    }
    else {
      throw e;
    }
  }

  let member;
  try {
    member = await message.guild.members.fetch(userId);
  }
  catch (e) {
    if (e.code !== APIErrors.UNKNOWN_MEMBER) {
      throw e;
    }
  }

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

  let guildConfig = await GuildConfig.get(message.guild.id);
  let muteInfo = await database.query("SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = 'mute'",[userId,message.guild.id]);
  if (muteInfo) {
    if(muteInfo.expireTime) {
      let remaining = muteInfo.expireTime - Math.floor(Date.now()/1000) > 0 ? muteInfo.expireTime - Math.floor(Date.now()/1000) : 1;
      muteInfo = `${icons.yes} - ${muteInfo.reason} \n**Remaining:** ${util.secToTime(remaining)}`;
    }
    else
      muteInfo = `${icons.yes} - ${muteInfo.reason}`;
  }
  else if (member && member.roles.cache.get(guildConfig.mutedRole)) {
    muteInfo = `${icons.yes} - Unknown reason and time`;
  }
  else {
    muteInfo = `${icons.no}`;
  }
  embed.setDescription(embed.description + `**Muted:** ${muteInfo} \n`);


  let banInfo = await database.query("SELECT * FROM moderations WHERE active = TRUE AND userid = ? AND guildid = ? AND action = 'ban'",[userId,message.guild.id]);
  if (banInfo) {
    if(banInfo.expireTime) {
      let remaining = banInfo.expireTime - Math.floor(Date.now()/1000) > 0 ? banInfo.expireTime - Math.floor(Date.now()/1000) : 1;
      banInfo = `${icons.yes} - ${banInfo.reason} \n**Remaining:** ${util.secToTime(remaining)}`;
    }
    else
      banInfo = `${icons.yes} - ${banInfo.reason}`;
    embed.setDescription(embed.description + `**Banned:** ${banInfo}`);
  }
  else {
    try {
      banInfo = await message.guild.fetchBan(/** @type {UserResolvable} */ userId);
      banInfo = `${icons.yes} - ${decodeURIComponent(banInfo.reason || 'Unknown reason')}`;
      embed.setDescription(embed.description + `**Banned:** ${banInfo}`);
    }
    catch (e) {
      if (e.code === APIErrors.UNKNOWN_BAN) {
        embed.setDescription(embed.description + `**Banned:** ${icons.no}`);
      }
      else {
        throw e;
      }
    }
  }
  await message.channel.send(embed);
};

module.exports = command;
