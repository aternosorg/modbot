const Discord = require('discord.js');
const guildConfig = require('../util/guildConfig.js');

const cacheDuration = 10*60*1000;

let guilds = new Discord.Collection();
let channels = new Discord.Collection();
let database, bot;

const util = {};

util.init = (db, client) => {
  database = db;
  bot = client;
}

util.icons = {
  error: String.fromCodePoint(128721),
  forbidden: String.fromCodePoint(9940),
  no: String.fromCodePoint(10060),
  yes: String.fromCodePoint(9989)
}

util.retry = async (fn, thisArg, args = [], maxRetries = 5, returnValMatch = null) => {
    let err;
    for (let i = 0; i < maxRetries; i++) {
        let res;
        try {
            res = await Promise.resolve(fn.apply(thisArg, args));
        } catch (e) {
            err = e;
            continue;
        }
        if (typeof returnValMatch === 'function' && !returnValMatch(res)) {
            err = new Error('Returned value did not match requirements');
            continue;
        }
        return res;
    }
    throw err;
}

util.channelMentionToId = (mention) => {
  if (/^<#\d+>$/.test(mention)) {
    return mention.match(/^<#(\d+)>$/)[1];
  }
  else if(/^\d+$/.test(mention)) {
    return mention;
  }
  else {
    return null;
  }
}

util.roleMentionToId = (mention) => {
  if (/^<@&?\d+>$/.test(mention)) {
    return mention.match(/^<@&?(\d+)>$/)[1];
  }
  else if(/^\d+$/.test(mention)) {
    return mention;
  }
  else {
    return null;
  }
}

util.userMentionToId = (mention) => {
  if (/^<@!?\d+>$/.test(mention)) {
    return mention.match(/^<@!?(\d+)>$/)[1];;
  }
  else if(/^\d+$/.test(mention)) {
    return mention;
  }
  else {
    return null;
  }
}

util.timeToSec = (time) => {
  //Convert time to s
  let seconds = 0;
  let words = time.split(' ');
  for (word of words) {

    if (!util.isTime(word))
      break;

    if (word.endsWith('s')) {
        seconds += parseInt(word);
    }
    else if (word.endsWith('m')) {
        seconds += parseInt(word) * 60;
    }
    else if (word.endsWith('h')) {
        seconds += parseInt(word) * 60 * 60;
    }
    else if (word.endsWith('d')) {
        seconds += parseInt(word) * 60 * 60 * 24;
    }
    else if (word.endsWith('w')) {
        seconds += parseInt(word) * 7 * 60 * 60 * 24;
    }
    else if (word.endsWith('M')) {
        seconds += parseInt(word) * 60 * 60 * 24 * 30;
    }
    else if (word.endsWith('y')) {
        seconds += parseInt(word) * 365 * 60 * 60 * 24;
    }
  };

  return Math.abs(seconds);
}

util.secToTime = (seconds) => {
  seconds = parseInt(seconds);

  let years, months,weeks,days,hours,minutes;
  years = Math.floor(seconds/(60*60*24*365));
  seconds = seconds - 60*60*24*365 * years;
  months = Math.floor(seconds/(60*60*24*30));
  seconds = seconds - 60*60*24*30 * months;
  weeks = Math.floor(seconds/(60*60*24*7));
  seconds = seconds - 60*60*24*7 * weeks;
  days = Math.floor(seconds/(60*60*24));
  seconds = seconds - 60*60*24 * days
  hours = Math.floor(seconds/(60*60));
  seconds = seconds - 60*60 * hours;
  minutes = Math.floor(seconds/60);
  seconds = seconds - 60 * minutes;

  let time = '';
  if(years)
    time += years+'y '
  if(months)
    time += months+'M '
  if(weeks)
    time += weeks+'w '
  if(days)
    time += days+'d '
  if(hours)
    time += hours+'h '
  if(minutes)
    time += minutes+'m '
  if(seconds)
    time += seconds+'s '

  return time.slice(0,-1);
}

util.isTime = (word) => {
  return /^\d+[yMwdhms]$/.test(word);
}

util.resolveGuild = async (guildInfo) => {
  let guild;
  if(guildInfo instanceof Discord.Message)
    return guildInfo.guild;
  else if(guildInfo instanceof Discord.Guild)
    return guildInfo;
  else
    return await bot.guilds.resolve(guildInfo);
}

util.logMessage = async (guildInfo, message) => {
  let guild = await util.resolveGuild(guildInfo);

  let guildConfig = await util.getGuildConfig(guildInfo);
  if (!guildConfig.logChannel) {
    return;
  }
  return await guild.channels.resolve(guildConfig.logChannel).send(message.substring(0,2000));
}

util.logMessageDeletion = async (message, reason) => {
  return await util.logMessageEmbed(message, `Message in <#${message.channel.id}> deleted`, {
      footer: {
        text: `${message.author.username}#${message.author.discriminator}`,
        iconURL: message.author.avatarURL()
      },
      color: 'ORANGE',
      fields: [{
        name: 'Message',
        value: message.content.substring(0,1024)
      },
      {
        name:'Reason',
        value: reason.substring(0,512)
      }]
    });
}

util.logMessageEmbed = async (guildInfo, message, embed) => {
  let guild = await util.resolveGuild(guildInfo);

  let guildConfig = await util.getGuildConfig(guildInfo);
  if (!guildConfig.logChannel) {
    return;
  }

  return await guild.channels.resolve(guildConfig.logChannel).send(message, new Discord.MessageEmbed(embed));
}

util.logMessageModeration = async (guildInfo, message, user, reason, insert, type, time) => {
  let guild = await util.resolveGuild(guildInfo)
  let guildConfig = await util.getGuildConfig(guildInfo)
  let embedColor;
  switch (type) {
    case "Ban":
      embedColor = 0xff0000
      break;
    case "Mute":
    case "Softban":
    case "Kick":
      embedColor = 0xfc6c04
      break;
    case "Unban":
    case "Unmute":
      embedColor = 0x1FD78D
      break;
  }
  const logembed = new Discord.MessageEmbed()
  .setColor(embedColor)
  .setAuthor(`Case ${insert.insertId} | ${type} | ${user.username}#${user.discriminator}`, user.avatarURL())
  .setFooter(`ID: ${user.id}`)
  .setTimestamp()
  .addFields(
    { name: "User", value: `<@${user.id}>`, inline: true},
    { name: "Moderator", value: `<@${message.author.id}>`, inline: true},
    { name: "Reason", value: reason, inline: true}
  )
  if(time) {
    logembed.addField("Duration", time, true)
  }
  return await guild.channels.resolve(guildConfig.logChannel).send(logembed);
}

util.chatSuccess = async (guildInfo, message, user, reason, type, time) => {
  let guild = await util.resolveGuild(guildInfo)
  let guildConfig = await util.getGuildConfig(guildInfo)
  let embedColor;
  switch (type) {
    case "banned":
      embedColor = 0xff0000
      break;
    case "muted":
    case "softbanned":
    case "kicked":
      embedColor = 0xfc6c04
      break;
    case "unbanned":
    case "unmuted":
      embedColor = 0x1FD78D
      break;
  }
  const responseEmbed = new Discord.MessageEmbed()
    .setColor(embedColor)
    .setDescription(`<@${user.id}> **has been ${type}.** | ${reason}`)
  if(time){
    responseEmbed.setDescription(`<@${user.id}> **has been ${type} for ${time}.** | ${reason}`)
  }

  return await message.channel.send(responseEmbed);
}

util.logMessageChecks = async (guildInfo, user, reason, insert, type) => {
  let guild = await util.resolveGuild(guildInfo)
  let guildConfig = await util.getGuildConfig(guildInfo)
  const logembed = new Discord.MessageEmbed()
  .setColor(0x1FD78D)
  .setAuthor(`Case ${insert.insertId} | ${type} | ${user.username}#${user.discriminator}`, user.avatarURL())
  .setFooter(`ID: ${user.id}`)
  .setTimestamp()
  .addFields(
    { name: "User", value: `<@${user.id}>`, inline: true},
    { name: "Reason", value: reason, inline: true}
  )

  return await guild.channels.resolve(guildConfig.logChannel).send(logembed);
}

util.getGuildConfig = async (guildInfo) => {
  let guild = await util.resolveGuild(guildInfo);

  if (!guilds.has(guild.id)) {
    if (!await util.refreshGuildConfig(guild.id))
      return new guildConfig(guild.id);
  }

  return guilds.get(guild.id);
}

util.saveGuildConfig = async (config) => {
  if(Object.keys(config).length <= 1) {
    await database.query("DELETE FROM guilds WHERE id = ?",config.id);
    return;
  }
  let result = await database.query("SELECT * FROM guilds WHERE id = ?",[config.id]);
  if(result){
    await database.query("UPDATE guilds SET config = ? WHERE id = ?",[JSON.stringify(config),config.id]);
  }
  else {
    await database.query("INSERT INTO guilds (config,id) VALUES (?,?)",[JSON.stringify(config),config.id]);
  }
  await util.refreshGuildConfig(config.id);
}

util.refreshGuildConfig = async (guildId) => {
  let result = await database.query("SELECT * FROM guilds WHERE id = ?", guildId);
  if(!result)
    return null;
  guilds.set(result.id, new guildConfig(result.id, JSON.parse(result.config)));
  setTimeout(() => {
    guilds.delete(result.id);
  },cacheDuration)
  return "Success!";
}

util.getChannelConfig = async (channelId) => {
  if (!channels.has(channelId)) {
    if (!await util.refreshChannelConfig(channelId))
      return null;
  }
  return channels.get(channelId);
}

util.refreshChannelConfig  = async (channelId) => {
  let result = await database.query("SELECT * FROM channels WHERE id = ?", channelId);
  if(!result)
    return null;
  channels.set(result.id, JSON.parse(result.config));
  setTimeout(() => {
    channels.delete(result.id);
  },cacheDuration);
  return "Success!";
}

util.isMod = async (member) => {
  let guildConfig = await util.getGuildConfig(member.guild);
  for (let [key,role] of member.roles.cache) {
    if (guildConfig.isModRole(key))
      return true;
  }
  return false;
}

util.moderationDBAdd = async (guildId, userId, action, reason, duration, moderatorId) => {
  let active = await database.query("SELECT * FROM moderations WHERE active = TRUE AND guildid = ? AND userid = ? AND action = ?", [guildId, userId, action]);
  //check user was already banned
  if (active) {
    await database.query("UPDATE moderations SET active = FALSE WHERE guildid = ? AND userid = ? AND action = ?", [guildId, userId, action])
  }

  let now = Math.floor(Date.now()/1000);
  let insert;
  if (duration) {
    insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[guildId, userId, action, now, now + duration, reason, moderatorId]);
  }
  else {
    insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, moderator) VALUES (?,?,?,?,?,?)",[guildId, userId, action, now, reason, moderatorId]);
  }
  return insert.insertId;
}

module.exports = util;
