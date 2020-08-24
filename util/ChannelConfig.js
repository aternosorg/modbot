const Discord = require('discord.js');

/**
 * Class representing the config of a channel
 */
class ChannelConfig {

    /**
     * Constructor - create a channel config
     *
     * @param  {Discord.Snowflake} id             channel id
     * @param  {Object}           [json]          options
     * @param  {Number}           [json.mode]     ip automod mode (0 => disabled, 1 => required, 2 => forbidden)
     * @param  {Number}           [json.cooldown] ip cooldown in seconds
     * @param  {Boolean}          [json.invites]  allow invites
     * @return {channelConfig} the config of the channel
     */

    constructor(id, json) {
        this.id = id;

        if (json) {
          this.mode = json.mode;
          this.cooldown = json.cooldown;
          this.invites = json.invites;
        }
    }
}

module.exports = ChannelConfig;
