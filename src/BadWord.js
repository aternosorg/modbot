const Discord = require('discord.js');

/**
 * Database
 * @type {Database}
 */
let database;

/**
 * Config cache time (ms)
 * @type {Number}
 */
const cacheDuration = 10*60*1000;

/**
 * channel wide bad words
 * @type {module:"discord.js".Collection}
 */
const channels = new Discord.Collection();

/**
 * guild wide bad words
 * @type {module:"discord.js".Collection}
 */
const guilds = new Discord.Collection();

/**
 * Class representing a bad word
 */
class BadWord {

  static triggerTypes = ['regex','include','match'];

  static punishmentTypes = ['none','ban','kick','mute','softban','strike'];

  /**
   * constructor - create a bad word
   * @param {module:"discord.js".Snowflake}     gid               guild ID
   * @param {Object}                            json              options
   * @param {Trigger}                           json.trigger      filter that triggers the bad word
   * @param {Punishment}                        json.punishment   punishment for the members which trigger this
   * @param {String}                            [json.response]   a message that is send by this filter. It's automatically deleted after 5 seconds
   * @param {Boolean}                           json.global       does this apply to all channels in this guild
   * @param {module:"discord.js".Snowflake[]}   [json.channels]   channels that this applies to
   * @param {Number}                            [id]              id in DB
   * @return {BadWord}
   */
  constructor(gid, json, id) {
    this.id = id;
    this.gid = gid;

    if (json) {
      this.trigger = json.trigger;
      this.punishment = json.punishment;
      this.response = json.response;
      this.global = json.global;
      this.channels = json.channels;
    }

    if (!this.channels) {
      this.channels = [];
    }
  }

  /**
   * serialize the bad word
   * @returns {(*|string)[]}
   */
  serialize() {
    return [this.gid, JSON.stringify(this.trigger), JSON.stringify(this.punishment), this.response, this.global, this.channels.join(',')];
  }

  /**
   * matches - does this message match this bad word
   * @param   {module:"discord.js".Message} message
   * @returns {boolean}
   */
  matches(message) {
    switch (this.trigger.type) {
      case "include":
        if (message.content.toLowerCase().includes(this.trigger.content.toLowerCase())) {
          return true;
        }
        break;

      case "match":
        if (message.content.toLowerCase() === this.trigger.content.toLowerCase()) {
          return true;
        }
        break;

      case "regex":
        let regex = new RegExp(this.trigger.content,this.trigger.flags);
        if (regex.test(message.content)) {
          return true;
        }
        break;
    }

    return false;
  }

  /**
   * Save this bad word to db and cache
   * @async
   * @return {Promise<Number>} id in db
   */
  async save() {
    if (!this.channels) {this.channels = null;}

    let dbentry = await database.queryAll("INSERT INTO badWords (`guildid`, `trigger`, `punishment`, `response`, `global`, `channels`) VALUES (?,?,?,?,?,?)",this.serialize());

    this.id = dbentry.insertId;

    if (this.global) {
      guilds.get(this.gid).set(this.id, this);
    }
    else {
      for (const channel of this.channels) {
        if(!channels.has(channel))
          channels.set(channel, new Discord.Collection());
        channels.get(channel).set(this.id, this);
      }
    }

    return dbentry.insertId;
  }

  /**
   * remove this bad word from cache and db
   * @async
   * @returns {Promise<void>}
   */
  async remove() {
    await database.query("DELETE FROM badWords WHERE id = ?",[this.id]);

    if (this.global) {
      guilds.get(this.gid).delete(this.id);
    }
    else {
      for (const channel of this.channels) {
        channels.get(channel).delete(this.id);
      }
    }
  }

  /**
   * generate an Embed displaying the info of this bad word
   * @param {String}        title
   * @param {Number}        color
   * @returns {module:"discord.js".MessageEmbed}
   */
  embed(title, color) {
    return new Discord.MessageEmbed()
        .setTitle(title + ` [${this.id}]`)
        .setColor(color)
        .addFields(
            /** @type {any} */[
          {name: "Trigger", value: `${this.trigger.type}: \`${this.trigger.type === 'regex' ? '/' + this.trigger.content + '/' + this.trigger.flags : this.trigger.content}\``},
          {name: "Punishment", value: `${this.punishment.type} for ${this.punishment.duration}`},
          {name: "Response", value: this.response.substring(0,1000)},
          {name: "Channels", value: this.global ? "global" : this.channels.map(c => `<#${c}>`).join(', ')}
        ]);
  }

  /**
   * save database
   * @param {Database} db
   */
  static init(db) {
    database = db;
  }

  /**
   * Get bad words for a channel
   * @async
   * @param {module:"discord.js".Snowflake} channelId
   * @param {module:"discord.js".Snowflake} guildId
   * @return {module:"discord.js".Collection<Number,BadWord>}
   */
  static async get (channelId, guildId) {

    if (!channels.has(channelId)) {
      await BadWord.refreshChannels(channelId);
    }

    if (!guilds.has(guildId)) {
      await BadWord.refreshGuild(guildId);
    }

    return channels.get(channelId).concat(guilds.get(guildId)).sort((a, b) => a.id - b.id);
  }

  /**
   * Get all bad words for a guild
   * @async
   * @param {module:"discord.js".Snowflake} guildId
   * @return {module:"discord.js".Collection<Number,BadWord>}
   */
  static async getAllBadWords (guildId) {

    const result = await database.queryAll("SELECT * FROM badWords WHERE guildid = ?", [guildId]);

    const badWords = new Discord.Collection();
    for (const res of result) {
      badWords.set(res.id, new BadWord(res.guildid, {
        trigger: JSON.parse(res.trigger),
        punishment: JSON.parse(res.punishment),
        response: res.response,
        global: res.global === 1,
        channels: res.channels.split(',')
      }, res.id));
    }

    return badWords.sort((a, b) => a.id - b.id);
  }

  /**
   * Reload bad word cache for a guild
   * @async
   * @param {module:"discord.js".Snowflake} guildId
   */
  static async refreshGuild(guildId) {
    const result = await database.queryAll("SELECT * FROM badWords WHERE guildid = ? AND global = TRUE", [guildId]);

    const newBadWords = new Discord.Collection();
    for (const res of result) {
      const o = new BadWord(res.guildid, {
        trigger: JSON.parse(res.trigger),
        punishment: JSON.parse(res.punishment),
        response: res.response,
        global: true,
        channels: []
      }, res.id);
      newBadWords.set(res.id, o);
    }
    guilds.set(guildId, newBadWords);
    setTimeout(() => {
      guilds.delete(guildId);
    },cacheDuration);
  }

  /**
   * Reload bad words cache for a channel
   * @async
   * @param {module:"discord.js".Snowflake} channelId
   */
  static async refreshChannels(channelId) {
    const result = await database.queryAll("SELECT * FROM badWords WHERE channels LIKE ?", [`%${channelId}%`]);

    const newBadWords = new Discord.Collection();
    for (const res of result) {
      newBadWords.set(res.id, new BadWord(res.guildid, {
        trigger: JSON.parse(res.trigger),
        response: res.response,
        global: false,
        channels: res.channels.split(',')
      }, res.id));
    }
    channels.set(channelId, newBadWords);
    setTimeout(() => {
      channels.delete(channelId);
    },cacheDuration);
  }

}

module.exports = BadWord;
