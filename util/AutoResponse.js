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
   *
   * @param {Discord.Snowflake}     gid       guild ID
   * @param {Object}                json      options
   * @param {AutoResponseTrigger}   json.trigger   filter that triggers the response
   * @param {String}                json.response  message to send to the channel
   * @param {Boolean}               json.global    does this apply to all channels in this guild
   * @param {Discord.Snowflake[]}   [json.channels]  channels that this applies to
   * @return {AutoResponse} the auto response
   */
  constructor(gid, json) {
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
   * matches - does this message match this auto-response
   * @param   {String}            content text in the message
   * @param   {Discord.Snowflake} channel channel id
   * @returns {boolean}
   */
  matches(content, channel) {
    if (!global && !channels.includes(channel)) {
      return false;
    }

    switch (trigger.type) {
      case "includes":
        if (content.toLowerCase().includes(trigger.content)) {
          return true;
        }
        break;

      case "matches":
        if (content.toLowerCase() === trigger.content) {
          return true;
        }
        break;

      case "regex":
        let regex = new RegExp(trigger.content,trigger.flags);
        if (regex.test(content)) {
          return true;
        }
        break;
    }

    return false;
  }
}

module.exports = AutoResponse;
