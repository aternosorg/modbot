const Discord = require('discord.js');
const GuildConfig = require('../util/GuildConfig.js');
const AutoResponse = require('../util/AutoResponse');
const ChannelConfig = require('../util/ChannelConfig.js');

/**
* Data that resolves to give a Guild object. This can be:
* * A Message object
* * A Guild object
* * A Snowflake
* @typedef {Discord.Message|Discord.Guild|Discord.Snowflake} GuildInfo
*/

/**
 * Config cache time (ms)
 * @type {Number}
 */
const cacheDuration = 10*60*1000;

/**
 * Guilds and their configs
 * @type {Discord.Collection}
 */
const guilds = new Discord.Collection();

/**
 * Channels and their configs
 * @type {Discord.Collection}
 */
const channels = new Discord.Collection();

/**
 * Database
 * @type {Database}
 */
let database;

/**
 * Discord client
 * @type {Discord.Client}
 */
let bot;

const util = {};

/**
 * Init - saves database and discord client
 * @param  {Database}       db      the database storing moderations, guilds, channels etc.
 * @param  {Discord.Client} client  the Discord client of the bot
 */
util.init = (db, client) => {
  database = db;
  bot = client;
  AutoResponse.init(db);
};

/**
 * Emoji as code points
 */
util.icons = {
  error: String.fromCodePoint(128721),
  forbidden: String.fromCodePoint(9940),
  no: String.fromCodePoint(10060),
  yes: String.fromCodePoint(9989)
};

/**
 * Color codes
 */
util.color = {
  red: 0xf04747,
  orange: 0xfaa61a,
  green: 0x43b581
};

/**
 * Resolves an action to a color
 * @param  {String} action name of the action to resolve
 * @return {Number|null}  hex color code or null
 */
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

/**
 * Retries a function if it fails
 * @async
 * @param {function}  fn                function to retry
 * @param {Object}    thisArg           object that should execute the function
 * @param {Array}     [args=[]]         arguments to pass to the function
 * @param {Number}    [maxRetries=5]    amount of retries before throwing an error
 * @param {function}  [returnValMatch]  function to test the result on
 * @return {*} result of fn
 */
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

/**
 * Converts a channel mention (<#channelId>) or channel id to a channel id
 * @param {String|Discord.Snowflake} mention channel mention (<#channelId>) or channel id
 * @return {Discord.Snowflake|null} channel id or null
 */
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

/**
 * Converts a role mention (<@&roleId>) or role id to a role id
 * @param {String|Discord.Snowflake} mention role mention (<@&roleId>) or role id
 * @return {Discord.Snowflake|null} role id or null
 */
util.roleMentionToId = (mention) => {
  if (/^<@&\d+>$/.test(mention)) {
    return mention.match(/^<@&?(\d+)>$/)[1];
  }
  else if(/^\d+$/.test(mention)) {
    return mention;
  }
  else {
    return null;
  }
};

/**
 * Converts a user mention (<@!userId> or <@userId>) or user id to a user id
 * @param {String|Discord.Snowflake} mention user mention (<@!userId> or <@userId>) or user id
 * @return {Discord.Snowflake|null} user id or null
 */
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

/**
 * Is this mention a valid user mention?
 * @async
 * @param {String|Discord.Snowflake} mention user mention (<@!userId> or <@userId>) or user id
 * @return {Boolean}
 */
util.isUserMention = async(mention) => {
  return await util.isUser(util.userMentionToId(mention));
};

/**
 * Is this id a valid user id?
 * @async
 * @param {Discord.Snowflake} id user id
 * @return {Boolean}
 */
util.isUser = async (id) => {
  let notUser;
  try {
    await bot.users.fetch(id);
  } catch (e) {
    notUser = true;
  }
  return notUser ? false : true;
};

/**
 * Is this mention a valid channel mention?
 * @async
 * @param {Discord.Guild} guild the guild that should have this channel
 * @param {String|Discord.Snowflake} mention channel mention (<#channelId>) or channel id
 * @return {Boolean}
 */
util.isChannelMention = async(guild, mention) => {
  return await util.isChannel(guild, util.channelMentionToId(mention));
};

/**
 * Is this id a valid channel id?
 * @async
 * @param {Discord.Guild} guild the guild that should have this channel
 * @param {Discord.Snowflake} id channel id
 * @return {Boolean}
 */
util.isChannel = async (guild, id) => {
  return await guild.channels.resolve(id) ? true : false;
};

/**
 * Converts a time string ("1d 5h 2s") to seconds. Supported time values: s, m, h, d, w, M, y
 * @param {String} time a time string ("1d 5h 2s")
 * @return {Number} time in seconds
 */
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

/**
 * Converts seconds ("1d 5h 2s") to a time string. Supported time values: s, m, h, d, M, y
 * @param {Number} seconds time in seconds
 * @return {String} a time string ("1d 5h 2s")
 */
util.secToTime = (seconds) => {
  seconds = parseInt(seconds);

  let years,months,days,hours,minutes;
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

/**
 * Is this a valid time word (1s)
 * @param {String} word the word to test
 * @return {Boolean}
 */
util.isTime = (word) => {
  return /^\d+[yMwdhms]$/.test(word);
};

/**
 * Resolves a guildInfo to a guild
 * @async
 * @param {GuildInfo} guildInfo
 * @return {Discord.Guild}
 */
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


/**
 * Logs a message to the guilds log channel (if specified)
 * @async
 * @param {GuildInfo} guildInfo guild
 * @param {String}    message   message to log
 * @return {Discord.Message} log message
 */
util.logMessage = async (guildInfo, message) => {
  let guild = await util.resolveGuild(guildInfo);

  let guildConfig = await util.getGuildConfig(guildInfo);
  if (!guildConfig.logChannel) {
    return;
  }
  return await guild.channels.resolve(guildConfig.logChannel).send(message.substring(0,2000));
};


/**
 * Logs the deletion of a message to the guilds log channel (if specified)
 * @async
 * @param message deleted message
 * @param reason  reason for the deletion
 * @return {Discord.Message} log message
 */
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

/**
 * Logs a message and an embed to the guilds log channel (if specified)
 * @async
 * @param {GuildInfo}                   guildInfo guild
 * @param {String}                      message   message to log
 * @param {Discord.MessageEmbed|Object} embed     embed to log
 * @return {Discord.Message} log message
 */
util.logMessageEmbed = async (guildInfo, message, embed) => {
  let guild = await util.resolveGuild(guildInfo);

  let guildConfig = await util.getGuildConfig(guildInfo);
  if (!guildConfig.logChannel) {
    return;
  }

  return await guild.channels.resolve(guildConfig.logChannel).send(message, new Discord.MessageEmbed(embed));
};

/**
 * Sends an embed to the channel
 * @async
 * @param {Discord.TextBasedChannel}    channel
 * @param {Discord.MessageEmbed|Object} options options for the embed
 * @return {Discord.Message}
 */
util.sendEmbed = async (channel, options) => {
  return await channel.send(new Discord.MessageEmbed(options));
};

/**
 * Log a moderation
 * @async
 * @param {GuildInfo}     guildInfo
 * @param {Discord.User}  moderator user that started the moderation
 * @param {Discord.User}  user      user that was moderated
 * @param {String}        reason    reason for the moderation
 * @param {Number}        insertId  id in the moderations table of the db
 * @param {String}        type      moderation action
 * @param {String}        [time]    duration of the moderation as a time string
 * @param {Number}        [amount]  amount of strikes that were given/pardoned
 * @param {Number}        [total]   total strike count
 * @return {Discord.Message}
 */
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
    { name: "Reason", value: reason.substring(0, 1024), inline: true}
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

/**
 * Respond with an embed
 * @async
 * @param {Discord.Channel} channel
 * @param {Discord.User}    user    user that was moderated
 * @param {String}          reason  reason for the moderation
 * @param {String}          type    moderation action
 * @param {String}          [time]  duration of the moderation as a time string
 * @return {Discord.Message}
 */
util.chatSuccess = async (channel, user, reason, type, time) => {
  let embedColor = util.color.resolve(type);

  const responseEmbed = new Discord.MessageEmbed()
    .setColor(embedColor)
    .setDescription(`**${user.username}#${user.discriminator}** has been **${type}** | ${reason.substring(0, 1800)}`);
  if (time) {
    responseEmbed.setDescription(`**${user.username}#${user.discriminator}** has been **${type}** for **${time}** | ${reason}`);
  }

  return await channel.send(responseEmbed);
};

/**
 * Log automatic unbans etc.
 * @async
 * @param {GuildInfo}     guildInfo
 * @param {Discord.User}  user      user that was moderated
 * @param {String}        reason    reason for the moderation
 * @param {Number}        insertId  id in the moderations table of the db
 * @param {String}        type      moderation action
 * @return {Discord.Message}
 */
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
    { name: "Reason", value: reason.substring(0, 512), inline: true}
  );

  return await guild.channels.resolve(guildConfig.logChannel).send(logembed);
};

/**
 * Get a guilds config from cache or db
 * @async
 * @param {GuildInfo} guildInfo
 * @return {GuildConfig}
 */
util.getGuildConfig = async (guildInfo) => {
  let guild = await util.resolveGuild(guildInfo);

  if (!guilds.has(guild.id)) {
    if (!await util.refreshGuildConfig(guild.id))
      return new GuildConfig(guild.id);
  }

  return guilds.get(guild.id);
};


/**
* Get a channels config from cache or db
* @async
* @param {Discord.Snowflake} channelId
* @return {ChannelConfig}
*/
util.getChannelConfig = async (channelId) => {
  if (!channels.has(channelId)) {
    if (!await util.refreshChannelConfig(channelId))
      return new ChannelConfig(channelId);
  }
  return channels.get(channelId);
};

/**
 * Save a guilds config to db and refresh cache
 * @async
 * @param {GuildConfig} config
 */
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

/**
 * Save a channels config to db and refresh cache
 * @async
 * @param {ChannelConfig} config
 */
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

/**
 * Reload guild config cache for a guild
 * @async
 * @param {Discord.Snowflake} guildId the guild's id
 * @return {Boolean} was there a config for this guild
 */
util.refreshGuildConfig = async(guildId) => {
  let result = await database.query("SELECT * FROM guilds WHERE id = ?", guildId);
  if(!result)
    return false;
  guilds.set(result.id, new GuildConfig(result.id, JSON.parse(result.config)));
  setTimeout(() => {
    guilds.delete(result.id);
  },cacheDuration);
  return true;
};

/**
 * Reload channel config cache for a channel
 * @async
 * @param {Discord.Snowflake} channelId the channel's id
 * @return {Boolean} was there a config for this channel
 */
util.refreshChannelConfig  = async (channelId) => {
  let result = await database.query("SELECT * FROM channels WHERE id = ?", channelId);
  if(!result)
    return false;
  channels.set(result.id, new ChannelConfig(result.id, JSON.parse(result.config)));
  setTimeout(() => {
    channels.delete(result.id);
  },cacheDuration);
  return true;
};

/**
 * Is this member a mod
 * @async
 * @param {Discord.Member} member member object of the user in the specific guild
 * @return {Boolean}
 */
util.isMod = async (member) => {
  let guildConfig = await util.getGuildConfig(member.guild);
  for (let [key] of member.roles.cache) {
    if (guildConfig.isModRole(key))
      return true;
  }
  return false;
};

/**
 * Save a moderation to the database
 * @async
 * @param {Discord.Snowflake} guildId       id of the guild
 * @param {Discord.Snowflake} userId        id of the moderated user
 * @param {String}            action        moderation type
 * @param {String}            reason        reason for the moderation
 * @param {Number}            [duration]    duration of the moderation
 * @param {Discord.Snowflake} [moderatorId] id of the moderator
 * @return {Number} the id of the moderation
 */
util.moderationDBAdd = async (guildId, userId, action, reason, duration, moderatorId) => {
  //disable old moderations
  await database.query("UPDATE moderations SET active = FALSE WHERE active = TRUE AND guildid = ? AND userid = ? AND action = ?", [guildId, userId, action]);

  let now = Math.floor(Date.now()/1000);
  let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, expireTime, reason, moderator) VALUES (?,?,?,?,?,?,?)",[guildId, userId, action, now, duration ? now + duration : null, reason, moderatorId]);
  return insert.insertId;
};

/**
 * Splits a string at one or multiple substrings
 * @param {String}          str     string to split
 * @param {String|String[]} splitAt strings to split at
 * @return {String[]}
 */
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

/**
 * Get an Embed showing the usage of a command
 * @param {String} command the name of the command
 * @return {Discord.MessageEmbed}
 */
util.usage = async(message, command) => {
  const help = require('../commands/help.js');
  return await help.getUse(message, command);
};

/**
* Fetch messages (even more than 100) from a channel
* @async
* @param {Discord.TextChannel|Discord.DMChannel} channel
* @param {Discord.ChannelLogsQueryOptions}       options
* @return {Discord.Collection} fetched messages
*/
util.getMessages = async (channel, options) => {
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

/**
 * Fetch messages before this message
 * @async
 * @param  {Discord.TextChannel|Discord.DMChannel}  channel
 * @param  {Discord.Snowflake}                      message last message
 * @param  {Number}                                 limit   max message count
 * @return {Discord.Collection} fetched messages
 */
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

/**
 * Fetch messages after this message
 * @async
 * @param  {Discord.TextChannel|Discord.DMChannel}  channel
 * @param  {Discord.Snowflake}                      message first message
 * @param  {Number}                                 limit   max message count
 * @return {Discord.Collection} fetched messages
 */
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


/**
 * Is this message ignored by auto-moderation
 * @async
 * @param {Discord.Message} message
 * @return {Boolean}
 */
util.ignoresAutomod = async (message) => {
  return message.author.bot || message.member.hasPermission('MANAGE_MESSAGES') || util.isMod(message.member);
};

/**
 * Delete messages (even more than 100)
 * @async
 * @param {Discord.TextBasedChannel}              channel
 * @param {Discord.Collection.<Discord.Message>}  messages messages to delete
 * @return {Promise.<Array.<Discord.Collection.<Discord.Message>>>} deleted messages
 */
util.bulkDelete = async (channel, messages) => {
  messages = messages.keyArray();
  let requests = [];
  for (let start = 0; start < messages.length; start += 100) {
    requests.push(channel.bulkDelete(messages.slice(start,start+100)));
  }
  return Promise.all(requests);
};

/**
 * Does the string start with any of the substrings
 * @param {String}    str     String to test
 * @param {String[]}  starts  possible starts
 * @return {String|Boolean} first matching string or false
 */
util.startsWithMultiple = (str, ...starts) => {
  for(let start of starts){
    if(str.startsWith(start)){
      return start;
    }
  }
  return false;
};

/**
 * delete - deletes a message and ignores it in message logs
 * @param {Discord.Message} message
 * @param {Object} [options] options to pass to the delete function
 * @returns {Promise<Discord.Message>}
 */
util.delete = async(message, options) => {
  const deleteLog = require('../features/messageDelete/deletion.js');
  deleteLog.ignore(message.id);
  try {
    return await util.retry(message.delete, message, [options]);
  } catch (e) {
    if (e.code === 10008) {
      return Promise.resolve(message);
    }
    throw e;
  }
};

/**
 * get all mentioned users
 * @param {String[]}  mentions array of strings with a user mention or id
 * @return {Discord.Snowflake[]} user ids
 */
util.userMentions = async(mentions) => {
  let res = [];
  while (mentions.length && await util.isUserMention(mentions[0])) {
    res.push(util.userMentionToId(mentions.shift()));
  }
  return res;
};

/**
 * get all mentioned channels
 * @param {Discord.Guild} guild the guild that should have this channel
 * @param {String[]}  mentions array of strings with a channel mention or id
 * @return {Discord.Snowflake[]} channel ids
 */
util.channelMentions = async(guild, mentions) => {
  let res = [];
  while (mentions.length && await util.isChannelMention(guild, mentions[0])) {
    res.push(util.channelMentionToId(mentions.shift()));
  }
  return res;
};

/**
 * get a response from a user in a channel
 * @param channel
 * @param author
 * @param timeout
 * @returns {Promise<string|null>}
 */
util.getResponse = async(channel, author, timeout = 15000) => {
  try {
    let result = await channel.awaitMessages(message => { return message.author.id === author; }, { max: 1, time: timeout, errors: ['time'] });
    return result.first().content;
  }
  catch {
    await channel.send("You took to long to respond.");
    return null;
  }
}

module.exports = util;
