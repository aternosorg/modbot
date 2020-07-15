const Discord = require('discord.js');

let guilds = new Discord.Collection();
let database;

const util = {};

util.init = (db) => {
  database = db;
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
  if(!/^<#\d+>$/.test(mention))
    return null;
  return mention.replace('<#','').replace('>','');
}

util.userMentionToId = (mention) => {
  if(!/^<@\d+>$/.test(mention))
    return null;
  return mention.replace('<@','').replace('>','');
}

util.timeToSec = (time) => {
  //Convert time to s
  let seconds = 0;
  let words = time.split(' ');
  for (word of words) {
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
      else if (word.endsWith('y')) {
          seconds += parseInt(word) * 365 * 60 * 60 * 24;
      }
      else {
        break;
      }
  };

  return Math.abs(seconds);
}

util.secToTime = (seconds) => {
  seconds = parseInt(seconds);

  let years,weeks,days,hours,minutes;
  years = Math.floor(seconds/31536000);
  seconds = seconds - 31536000 * years;
  weeks = Math.floor(seconds/8467200);
  seconds = seconds - 8467200 * weeks;
  days = Math.floor(seconds/86400);
  seconds = seconds - 86400 * days
  hours = Math.floor(seconds/3600);
  seconds = seconds - 3600 * hours;
  minutes = Math.floor(seconds/60);
  seconds = seconds - 60 * minutes;

  let time = '';
  if(years)
    time += years+'y '
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
  return /^\d+[ywdhms]$/.test(word);
}

util.log = async (message, logMessage, logEmbed) => {
  if (!guilds.has(message.guild.id)) {
    if (!await util.refreshGuildConfig(message.guild.id))
      return;
  }
  try {
    await message.guild.channels.resolve(guilds.get(message.guild.id).logChannel).send(logMessage, new Discord.MessageEmbed(logEmbed));
  } catch (e) {
    console.error("Failed to log", e)
  }
}

util.refreshGuildConfig = async (guildId) => {
  let result = await database.query("SELECT * FROM guilds WHERE id = ?", guildId);
  if(!result)
    return;
  guilds.set(result.id, JSON.parse(result.config));
  return "Success!";
}

module.exports = util;
