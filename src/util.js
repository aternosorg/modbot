const {
    Constants,
    Client,
    Snowflake,
    Guild,
    Message,
    TextChannel,
    DMChannel,
    ChannelLogsQueryOptions,
    Collection,
    NewsChannel,
} = require('discord.js');
const Database = require('./Database');
const GuildConfig = require('./config/GuildConfig.js');
const ChatTriggeredFeature = require('./ChatTriggeredFeature');
const Config = require('./config/Config');
const RateLimiter = require('./RateLimiter');
const {APIErrors} = Constants;
const {GuildInfo} = require('./Typedefs');

/**
 * Default timeout for responses in minutes
 * @type {number}
 */
const responseWaitTime = 30;

/**
 * Database
 * @type {Database}
 */
let database;

/**
 * Discord client
 * @type {Client}
 */
let bot;

const util = {};

/**
 * Init - saves database and discord client
 * @param  {Database}                   db      the database storing moderations, guilds, channels etc.
 * @param  {Client} client  the Discord client of the bot
 */
util.init = (db, client) => {
    database = db;
    bot = client;
    ChatTriggeredFeature.init(database);
    Config.init(database, client);
    RateLimiter.init(database);
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
        case 'striked':
        case 'muted':
        case 'softbanned':
        case 'kicked':
        case 'strike':
        case 'mute':
        case 'softban':
        case 'kick':
            return util.color.orange;
        case 'pardon':
        case 'pardoned':
        case 'unbanned':
        case 'unmuted':
        case 'unban':
        case 'unmute':
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
 * @param {String|Snowflake}  mention channel mention (<#channelId>) or channel id
 * @return {Snowflake|null}   channel id or null
 */
util.channelMentionToId = (mention) => {
    if (/^<#\d+>$/.test(mention)) {
        return /** @type {Snowflake|null} */ mention.match(/^<#(\d+)>$/)[1];
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
 * @param {String|Snowflake}  mention role mention (<@&roleId>) or role id
 * @return {Snowflake|null}   role id or null
 */
util.roleMentionToId = (mention) => {
    if (/^<@&\d+>$/.test(mention)) {
        return /** @type {Snowflake|null} */ mention.match(/^<@&?(\d+)>$/)[1];
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
 * @param {String|Snowflake}  mention user mention (<@!userId> or <@userId>) or user id
 * @return {Snowflake|null}   user id or null
 */
util.userMentionToId = (mention) => {
    if (/^<@!?\d+>$/.test(mention)) {
        return /** @type {Snowflake|null} */ mention.match(/^<@!?(\d+)>$/)[1];
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
 * @param {String|Snowflake} mention user mention (<@!userId> or <@userId>) or user id
 * @return {Promise<Boolean>}
 */
util.isUserMention = async(mention) => {
    return util.isUser(util.userMentionToId(mention));
};

/**
 * Is this id a valid user id?
 * @async
 * @param {Snowflake} id user id
 * @return {Promise<Boolean>}
 */
util.isUser = async (id) => {
    if (!id) return false;
    try {
        await bot.users.fetch(id);
    } catch (e) {
        if (e.code === APIErrors.UNKNOWN_USER || e.httpStatus === 404) {
            return false;
        }
        else {
            throw e;
        }
    }
    return true;
};

/**
 * Is this mention a valid channel mention?
 * @async
 * @param {Guild}             guild the guild that should have this channel
 * @param {String|Snowflake}  mention channel mention (<#channelId>) or channel id
 * @return {Boolean}
 */
util.isChannelMention = (guild, mention) => {
    return util.isChannel(guild, util.channelMentionToId(mention));
};

/**
 * Is this id a valid channel id?
 * @async
 * @param {Guild}     guild the guild that should have this channel
 * @param {Snowflake} id channel id
 * @return {Boolean}
 */
util.isChannel = (guild, id) => {
    return !!guild.channels.resolve(id);
};

/**
 * Is this id a valid role id?
 * @async
 * @param {Guild}     guild the guild that should have this role
 * @param {Snowflake} id role id
 * @return {Boolean}
 */
util.isRole = (guild, id) => {
    return !!guild.roles.fetch(id);
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
 * @param {Number|String} seconds time in seconds
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
 * @return {Guild}
 */
util.resolveGuild = async (guildInfo) => {
    if (guildInfo instanceof Message){
        return guildInfo.guild;
    }
    if (guildInfo instanceof Guild) {
        return guildInfo;
    }
    try {
        return await bot.guilds.fetch(/** @type {Snowflake} */ guildInfo);
    }
    catch (e) {
        if (e.code === APIErrors.UNKNOWN_GUILD) {
            return null;
        }
        else {
            throw e;
        }
    }
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
        const char = str.charAt(i),
            next = str.charAt(i+1);
        if (i === 0 && char === '\'') {
            quote = true;
            continue;
        }
        if (i === 0 && char === '"') {
            dQuote = true;
            continue;
        }
        if (splitAt.includes(char) && !quote && !dQuote){
            if (next === '\'') {
                quote = true;
                i++;
            }
            if (next === '"') {
                dQuote = true;
                i++;
            }
            if(current.length){
                parts.push(current);
            }
            current = '';
            continue;
        }
        if (quote && char === '\'' && (next === '' || splitAt.includes(next))) {
            quote = false;
            continue;
        }
        if (dQuote && char === '"' && (next === '' || splitAt.includes(next))) {
            dQuote = false;
            continue;
        }
        current += char;
    }

    const remaining = [];
    if (quote || dQuote) {
        remaining.push(...util.split(current, ...splitAt));
        current = (quote ? '\'' : '"') + (remaining.shift() || '');
    }

    if(current.length){
        parts.push(current, ...remaining);
    }
    return parts;
};

/**
* Fetch messages (even more than 100) from a channel
* @async
* @param {TextChannel|DMChannel} channel
* @param {ChannelLogsQueryOptions} options
* @return {Promise<Collection>} fetched messages
*/
util.getMessages = async (channel, options) => {
    if (options.before) {
        return messagesBefore(channel, /** @type {Snowflake} */ options.before, options.limit);
    }
    else if (options.after) {
        return messagesAfter(channel, /** @type {Snowflake} */ options.before, options.limit);
    }
    else if (options.around) {
        let before = await messagesBefore(channel, /** @type {Snowflake} */ options.around, Math.floor(options.limit / 2));
        return before.concat(await messagesAfter(channel, /** @type {Snowflake} */ options.around, Math.floor(options.limit / 2)));
    }
    else {
        return messagesBefore(channel, undefined, options.limit);
    }
};

/**
 * Fetch messages before this message
 * @async
 * @param  {TextChannel|DMChannel} channel
 * @param  {Snowflake} message last message
 * @param  {Number} limit   max message count
 * @return {Collection<Snowflake, Message>} fetched messages
 */
async function messagesBefore(channel, message, limit) {
    let before = message;
    let messages = new Collection();
    for (let remaining = limit; remaining > 0; remaining -= 100) {
        /** @type {Collection<Snowflake, Message>} */
        const res = await channel.messages.fetch( /** @type {ChannelLogsQueryOptions} */{
            before: before,
            limit: remaining > 100 ? 100: remaining
        }, {cache: false});

        if (res.size === 0) return messages;

        messages = messages.concat(res);
        before = res.last().id;
    }
    return messages;
}

/**
 * Fetch messages after this message
 * @async
 * @param  {TextChannel|DMChannel}  channel
 * @param  {Snowflake}                      message first message
 * @param  {Number}                                             limit   max message count
 * @return {Collection<Snowflake, Message>} fetched messages
 */
async function messagesAfter(channel, message, limit) {
    let after = message;
    let messages = new Collection();
    for (let remaining = limit; remaining > 0; remaining -= 100) {
        let res = await channel.messages.fetch(/** @type {ChannelLogsQueryOptions} */ {
            after: after,
            limit: remaining > 100 ? 100: remaining
        }, {cache: false});
        messages = messages.concat(res);
        after = res.first().id;
    }
    return messages;
}


/**
 * Is this message ignored by auto-moderation
 * @async
 * @param {Message} message
 * @return {Boolean}
 */
util.ignoresAutomod = async (message) => {
    if (!message.guild) return false;
    /** @type {GuildConfig} */
    const guildconfig = await GuildConfig.get(message.guild.id);
    return message.author.bot || message.member.permissions.has('MANAGE_MESSAGES') || guildconfig.isProtected(message.member);
};

/**
 * Delete messages (even more than 100)
 * @async
 * @param {TextChannel | DMChannel | NewsChannel}                          channel
 * @param {Collection<Snowflake>}  messages messages to delete
 * @return {Promise<Collection<Snowflake, Message>[]>} deleted messages
 */
util.bulkDelete = async (channel, messages) => {
    const keys = messages.keyArray();
    let requests = [];
    for (let start = 0; start < keys.length; start += 100) {
        requests.push(channel.bulkDelete(keys.slice(start,start+100), true));
    }
    return Promise.all(requests);
};

/**
 * Does the string start with any of the substrings
 * @param {String}    str     String to test
 * @param {String}  starts  possible starts
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
 * @param {Message} message
 * @param {Object} [options]
 * @param {Number} [options.timeout]
 * @returns {Promise}
 */
util.delete = async(message, options = {}) => {
    if (options.timeout) {
        setTimeout(() => {
            util.delete(message).catch(console.error);
        }, options.timeout);
        return;
    }

    const deleteLog = require('./features/messageDelete/deletion.js');
    deleteLog.ignore(message.id);
    try {
        return await util.retry(message.delete, message);
    } catch (e) {
        if (e.code === APIErrors.UNKNOWN_MESSAGE) {
            return Promise.resolve(message);
        }
        throw e;
    }
};

/**
 * get all mentioned users
 * @param {String[]}  mentions array of strings with a user mention or id
 * @return {Snowflake[]} user ids
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
 * @param {Guild} guild     the guild that should have this channel
 * @param {String[]}                  mentions  array of strings with a channel mention or id
 * @return {Snowflake[]} channel ids
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
util.getResponse = async(channel, author, timeout = responseWaitTime*60*1000) => {
    try {
        let result = await channel.awaitMessages({
            filter: message => { return message.author.id === author;},
            max: 1, time: timeout, errors: ['time']
        });
        result = result.first().content;
        if (result.toLowerCase() === '!cancel')
            return null;
        else
            return result;
    }
    catch (e) {
        if (e instanceof Map && e.size === 0) {
            await channel.send('You took to long to respond.');
            return null;
        }
        else {
            throw e;
        }
    }
};

/**
 * Convert a string to tile case
 * @param {String} s
 */
util.toTitleCase = (s) => {
    return s.toLowerCase().replace(/^(\w)|\s(\w)/g, c => c.toUpperCase());
};

/**
 * filter an array with an asynchronous filter function
 * @param {Array} arr
 * @param {Function} filter
 * @param [args]
 * @return {Promise<[]>}
 */
util.asyncFilter = async (arr, filter, ...args) => {
    const res = [];
    for (const element of arr) {
        if (await filter(element, ...args))
            res.push(element);
    }
    return res;
};

/**
 * escape discord formatting codes in a string
 * @param {String} string
 * @returns {String}
 */
util.escapeFormatting = (string) => {
    let currentOffset = 0;
    string = string.replace(/(.*?)(https?:\/\/[^\s\n]+)/g, (match, before, url) => {
        let res = before.replace(/([*_~`])/g,'\\$1') + url;
        currentOffset += res.length;
        return res;
    });
    return string.substr(0, currentOffset) +
      string.substr(currentOffset).replace(/([*_~`])/g,'\\$1');
};

module.exports = util;
