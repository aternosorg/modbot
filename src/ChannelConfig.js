/**
 * Class representing the config of a channel
 */
class ChannelConfig {

    /**
     * Constructor - create a channel config
     *
     * @param  {module:"discord.js".Snowflake}  id             channel id
     * @param  {Object}                         [json]          options
     * @param  {Boolean}                        [json.invites]  allow invites
     * @param  {Object}                         [json.lock]     permissions before locking (only affected perms)
     * @return {ChannelConfig} the config of the channel
     */

    constructor(id, json) {
        this.id = id;

        if (json) {
          this.invites = json.invites;
          this.lock = json.lock;
        }

        if (!this.lock) {
          this.lock = {};
        }
    }
}

module.exports = ChannelConfig;
