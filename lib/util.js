const Discord = require('discord.js');
const GuildConfig = require('../util/GuildConfig.js');
const ChannelConfig = require('../util/ChannelConfig.js');

const cacheDuration = 10*60*1000;

const guilds = new Discord.Collection();

const channels = new Discord.Collection();
let database;
let bot;

const util = {};

util.init = (db, client) => {
  database = db;
  bot = client;
};

util.icons = {
  error: String.fromCodePoint(128721),
  forbidden: String.fromCodePoint(9940),
  no: String.fromCodePoint(10060),
  yes: String.fromCodePoint(9989)
};

util.color = {
  red: 0xf04747,
  orange: 0xfaa61a,
  green: 0x43b581
};

util.color.resolve = (action) => {
  switch (action.toLowerCase()) {
    case 'banned':
    case 'ban':
      return util.color.red;
    case "striked":
    case "muted":
    case "softbanned":
    case "kicked":
    case "strike":
    case "mute":
    case "softban":
    case "kick":
      return util.color.orange;
    case "pardon":
    case "pardoned":
    case "unbanned":
    case "unmuted":
    case "unban":
    case "unmute":
      return util.color.green;
  }
  return null;
};

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
};

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
};

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
};

util.userMentionToId = (mention) => {
  if (/^<@!?\d+>$/.test(mention)) {
    return mention.match(/^<@!?(\d+)>$/)[1];
  }
  else if(/^\d+$/.test(mention)) {
    return mention;
  }
  else {
    return null;
  }
};

util.isUserMention = async(mention) => {
  return await util.isUser(util.userMentionToId(mention));
};

util.isUser = async (id) => {
  let notUser;
  try {
    await bot.users.fetch(id);
  } catch (e) {
    notUser = true;
  }
  if (notUser) {
    return false;
  }
  return true;
};

util.timeToSec = (time) => {
  //Convert time to s
  let seconds = 0;
  let words = time.split(' ');
  for (let word of words) {

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
  }

  return Math.abs(seconds);
};

util.secToTime = (seconds) => {
  seconds = parseInt(seconds);

  let years, months,weeks,days,hours,minutes;
  years = Math.floor(seconds/(60*60*24*365));
  seconds = seconds - 60*60*24*365 * years;
  months = Math.floor(seconds/(60*60*24*30));
  seconds = seconds - 60*60*24*30 * months;
  days = Math.floor(seconds/(60*60*24));
  seconds = seconds - 60*60*24 * days;
  hours = Math.floor(seconds/(60*60));
  seconds = seconds - 60*60 * hours;
  minutes = Math.floor(seconds/60);
  seconds = seconds - 60 * minutes;

  let time = '';
  if(years)
    time += years+'y ';
  if(months)
    time += months+'M ';
  if(days)
    time += days+'d ';
  if(hours)
    time += hours+'h ';
  if(minutes)
    time += minutes+'m ';
  if(seconds)
    time += seconds+'s ';

  return time.slice(0,-1);
};

util.isTime = (word) => {
  return /^\d+[yMwdhms]$/.test(word);
};

util.resolveGuild = async (guildInfo) => {
  if (guildInfo instanceof Discord.Message){
    return guildInfo.guild;
  }
  if (guildInfo instanceof Discord.Guild) {
    return guildInfo;
  }
  try {
    return await bot.guilds.fetch(guildInfo);
  } catch (e) {
    return null;
  }
};

util.logMessage = async (guildInfo, message) => {
  let guild = await util.resolveGuild(guildInfo);

  let guildConfig = await util.getGuildConfig(guildInfo);
  if (!guildConfig.logChannel) {
    return;
  }
  return await guild.channels.resolve(guildConfig.logChannel).send(message.substring(0,2000));
};

util.logMessageDeletion = async (message, reason) => {
  return await util.logMessageEmbed(message, `Message in <#${message.channel.id}> deleted`, {
      footer: {
        text: `${message.author.username}#${message.author.discriminator}`,
        iconURL: message.author.avatarURL()
      },
      color: util.color.orange,
      fields: [{
        name: 'Message',
        value: message.content.substring(0,1024)
      },
      {
        name:'Reason',
        value: reason.substring(0,512)
      }]
    });
};

util.logMessageEmbed = async (guildInfo, message, embed) => {
  let guild = await util.resolveGuild(guildInfo);

  let guildConfig = await util.getGuildConfig(guildInfo);
  if (!guildConfig.logChannel) {
    return;
  }

  return await guild.channels.resolve(guildConfig.logChannel).send(message, new Discord.MessageEmbed(embed));
};

util.sendEmbed = async (channel, options) => {
  return await channel.send(new Discord.MessageEmbed(options));
};

util.logMessageModeration = async (guildInfo, moderator, user, reason, insertId, type, time, amount, total) => {
  let guild = await util.resolveGuild(guildInfo);
  let guildConfig = await util.getGuildConfig(guildInfo);
  if (!guildConfig.logChannel) {
    return ;
  }
  let embedColor = util.color.resolve(type);
  const logembed = new Discord.MessageEmbed()
  .setColor(embedColor)
  .setAuthor(`Case ${insertId} | ${type} | ${user.username}#${user.discriminator}`, user.avatarURL())
  .setFooter(`ID: ${user.id}`)
  .setTimestamp()
  .addFields(
    { name: "User", value: `<@${user.id}>`, inline: true},
    { name: "Moderator", value: `<@${moderator.id}>`, inline: true},
    { name: "Reason", value: reason, inline: true}
  );
  if (time) {
    logembed.addField("Duration", time, true);
  }
  if (amount) {
    logembed.addField("Amount", amount, true);
    logembed.addField("Total Strikes", total, true);
  }
  return await guild.channels.resolve(guildConfig.logChannel).send(logembed);
};

util.chatSuccess = async (channel, user, reason, type, time) => {
  let embedColor = util.color.resolve(type);

  const responseEmbed = new Discord.MessageEmbed()
    .setColor(embedColor)
    .setDescription(`**${user.username}#${user.discriminator}** has been **${type}** | ${reason}`);
  if (time) {
    responseEmbed.setDescription(`**${user.username}#${user.discriminator}** has been **${type}** for **${time}** | ${reason}`);
  }

  return await channel.send(responseEmbed);
};

util.logMessageChecks = async (guildInfo, user, reason, insertId, type) => {
  let guild = await util.resolveGuild(guildInfo);
  let guildConfig = await util.getGuildConfig(guildInfo);
  if (!guildConfig.logChannel) {
    return ;
  }
  const logembed = new Discord.MessageEmbed()
  .setColor(util.color.green)
  .setAuthor(`Case ${insertId} | ${type} | ${user.username}#${user.discriminator}`, user.avatarURL())
  .setFooter(`ID: ${user.id}`)
  .setTimestamp()
  .addFields(
    { name: "User", value: `<@${user.id}>`, inline: true},
    { name: "Reason", value: reason, inline: true}
  );

  return await guild.channels.resolve(guildConfig.logChannel).send(logembed);
};

util.getGuildConfig = async (guildInfo) => {
  let guild = await util.resolveGuild(guildInfo);

  if (!guilds.has(guild.id)) {
    if (!await util.refreshGuildConfig(guild.id))
      return new GuildConfig(guild.id);
  }

  return guilds.get(guild.id);
};

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
};

util.saveChannelConfig = async (config) => {
  if(Object.keys(config).length <= 1) {
    await database.query("DELETE FROM channels WHERE id = ?",config.id);
    return;
  }
  let result = await database.query("SELECT * FROM channels WHERE id = ?",[config.id]);
  if(result){
    await database.query("UPDATE channels SET config = ? WHERE id = ?",[JSON.stringify(config),config.id]);
  }
  else {
    await database.query("INSERT INTO channels (config,id) VALUES (?,?)",[JSON.stringify(config),config.id]);
  }
  await util.refreshChannelConfig(config.id);
};

util.refreshGuildConfig = async (guildId) => {
  let result = await database.query("SELECT * FROM guilds WHERE id = ?", guildId);
  if(!result)
    return null;
  guilds.set(result.id, new GuildConfig(result.id, JSON.parse(result.config)));
  setTimeout(() => {
    guilds.delete(result.id);
  },cacheDuration);
  return "Success!";
};

util.getChannelConfig = async (channelId) => {
  if (!channels.has(channelId)) {
    if (!await util.refreshChannelConfig(channelId))
      return new ChannelConfig(channelId);
  }
  return channels.get(channelId);
};

util.refreshChannelConfig  = async (channelId) => {
  let result = await database.query("SELECT * FROM channels WHERE id = ?", channelId);
  if(!result)
    return null;
  channels.set(result.id, new ChannelConfig(result.id, JSON.parse(result.config)));
  setTimeout(() => {
    channels.delete(result.id);
  },cacheDuration);
  return "Success!";
};

util.isMod = async (member) => {
  let guildConfig = await util.getGuildConfig(member.guild);
  for (let [key,role] of member.roles.cache) {
    if (guildConfig.isModRole(key))
      return true;
  }
  return false;
};

util.moderationDBAdd = async (guildId, userId, action, reason, duration, moderatorId) => {
  //disable old moderations
  await database.query("UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = ?", [guildId, userId, action]);

  let now = Math.floor(Date.now()/1000);
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[guildId, userId, action, now, duration ? now + duration : null, reason, moderatorId]);
  return insert.insertId;
};

util.split = (str, ...splitAt) => {
    let quote = false,
        dQuote = false,
        parts = [],
        current = '';

    for(let i = 0; i < str.length; i++){
        let char = str.charAt(i);
        if(char === '"' && !quote){
            dQuote = !dQuote;
            continue;
        }
        if(char === "'" && !dQuote){
            quote = !quote;
            continue;
        }
        if(!quote && !dQuote && splitAt.includes(char)){
            if(current.length){
                parts.push(current);
            }
            current = '';
            continue;
        }
        current += char;
    }

    if(current.length){
        parts.push(current);
    }
    return parts;
};

util.getMessages = async (channel, options) => {
  let messages = new Discord.Collection();
  if (options.before) {
    return await messagesBefore(channel, options.before, options.limit);
  }
  else if (options.after) {
    return await messagesAfter(channel, options.before, options.limit);
  }
  else if (options.around) {
    let before = await messagesBefore(channel, options.around, Math.floor(options.limit / 2));
    return before.concat(await messagesAfter(channel, options.around, Math.floor(options.limit / 2)));
  }
  else {
    return await messagesBefore(channel, undefined, options.limit);
  }
};

async function messagesBefore(channel, message, limit) {
  let before = message;
  let messages = new Discord.Collection();
  for (let remaining = limit; remaining > 0; remaining -= 100) {
    let res = await channel.messages.fetch({
      before: before,
      limit: remaining > 100 ? 100: remaining
    }, false);
    messages = messages.concat(res);
    before = res.last().id;
  }
  return messages;
}

async function messagesAfter(channel, message, limit) {
  let after = message;
  let messages = new Discord.Collection();
  for (let remaining = limit; remaining > 0; remaining -= 100) {
    let res = await channel.messages.fetch({
      after: after,
      limit: remaining > 100 ? 100: remaining
    }, false);
    messages = messages.concat(res);
    after = res.first().id;
  }
  return messages;
}

util.ignoresAutomod = async (message) => {
  return message.author.bot || message.member.hasPermission('MANAGE_MESSAGES') || util.isMod(message.member);
};

util.bulkDelete = async (channel, messages) => {
  messages = messages.keyArray();
  let requests = [];
  for (let start = 0; start < messages.length; start += 100) {
    requests.push(channel.bulkDelete(messages.slice(start,start+100)));
  }
  return Promise.all(requests);
};

util.startsWithMultiple = (str, ...starts) => {
  for(let start of starts){
    if(str.startsWith(start)){
      return start;
    }
  }
  return false;
};

module.exports = util;
