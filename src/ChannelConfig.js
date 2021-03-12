const Config = require('./Config');

/**
 * Class representing the config of a channel
 */
class ChannelConfig extends Config {

    static tableName = 'channels';

    /**
     * Constructor - create a channel config
     *
     * @param  {module:"discord.js".Snowflake}  id             channel id
     * @param  {module:"discord.js".Snowflake}  guildid
     * @param  {Object}                         [json]          options
     * @param  {Boolean}                        [json.invites]  allow invites
     * @param  {Object}                         [json.lock]     permissions before locking (only affected perms)
     * @return {ChannelConfig} the config of the channel
     */

    constructor(id, guildid, json = {}) {
        super(id);
        this.guildid = guildid;

        this.invites = json.invites;
        this.lock = json.lock || {};
    }

    /**
     * Insert this config into the DB
     * @param {String}  json
     * @param {String}  escapedTable
     * @return {Promise<void>}
     * @private
     */
    static async _insert(json, escapedTable) {
        return this.database.query(`INSERT INTO ${escapedTable} (config,id,guildid) VALUES (?,?,?)`,[json,this.id, this.guildid]);
    }
}

module.exports = ChannelConfig;
