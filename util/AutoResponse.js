const Discord = require('discord.js');

/**
 * A trigger for an AutoResponse this can be:
 * * a string that has to be included
 * * a string that has to match the message
 * * a regex
 * @typedef {Object} AutoResponseTrigger
 * @property {String} type the type of the trigger possible types:
 * * regex
 * * include
 * * matche
 * @property {String} content the string or regex
 * @property {String} [flags] flags for regex's
 */

/**
 * Class representing an auto response
 */
class AutoResponse {

  static triggerTypes = ['regex','include','match'];

  /**
   * constructor - create a channel config
   * @param {Discord.Snowflake}     gid               guild ID
   * @param {Object}                json              options
   * @param {AutoResponseTrigger}   json.trigger      filter that triggers the response
   * @param {String}                json.response     message to send to the channel
   * @param {Boolean}               json.global       does this apply to all channels in this guild
   * @param {Discord.Snowflake[]}   [json.channels]   channels that this applies to
   * @param {Number}                [id]              id in DB
   * @return {AutoResponse} the auto response
   */
  constructor(gid, json, id) {
    this.id = id;
    this.gid = gid;

    if (json) {
      this.trigger = json.trigger;
      this.response = json.response;
      this.global = json.global;
      this.channels = json.channels;
    }

    if (!this.channels) {
      this.channels = [];
    }
  }

  /**
   * serialize the response
   * @returns {(*|string)[]}
   */
  serialize() {
    return [this.gid, JSON.stringify(this.trigger), this.response, this.global, this.channels.join(',')];
  }

  /**
   * matches - does this message match this auto-response
   * @param   {Discord.Message} message
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
        if (message.content.toLowerCase() === this.trigger.content) {
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
}

module.exports = AutoResponse;
