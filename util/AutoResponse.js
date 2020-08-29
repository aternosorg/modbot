const Discord = require('discord.js');


/**
 * A trigger for an AutoResponse this can be:
 * * a string that has to be included
 * * a string that has to match the message
 * * a regex
 * @typedef {Object} AutoResponseTrigger
 * @property {String} type the type of the trigger
 * @property {String} content the string or regex
 * @property {String} [flags] flags for regex's
 */

/**
 * Class representing an auto response
 */
class AutoResponse {

  /**
   * constructor - create a channel config
   *
   * @param {Discord.Snowflake}     gid       guild ID
   * @param {Object}                json      options
   * @param {AutoResponseTrigger[]} triggers  filters that trigger the response
   * @param {String}                response  message to send to the channel
   * @param {Boolean}               global    does this apply to all channels in this guild
   * @param {Discord.Snowflake[]}   [channels]  channels that this applies to
   * @return {AutoResponse} the auto response
   */
  constructor(id, json) {
    this.id = id;

    if (json) {
      this.triggers = json.triggers;
      this.response = json.response;
      this.global = json.global;
      this.channels = json.channels;
    }
  }

  matches(content, channel) {
    if (!this.global && !this.channel.includes(channel)) {
      return false;
    }

    for(let trigger of this.triggers) {
      switch (trigger.type) {
        case "includes":
          if (content.includes(trigger.content)) {
            return true;
          }
          break;

        case "matches":
          if (content === trigger.content) {
            return true;
          }
          break;

        case "regex":
          let regex = new Regexp(trigger.content,trigger.flags);
          if (regex.test(content)) {
            return true;
          }
          break;
      }
    }
    return false;
  }
}
