const Config = require('./Config');

/**
 * Class representing the config of a channel
 */
class ChannelConfig extends Config {

    static tableName = 'channels';

    invites;

    lock;

    /**
     * Constructor - create a channel config
     *
     * @param  {module:"discord.js".Snowflake}  id             channel id
     * @param  {Object}                         [json]          options
     * @param  {Boolean}                        [json.invites]  allow invites
     * @param  {Object}                         [json.lock]     permissions before locking (only affected perms)
     * @return {ChannelConfig} the config of the channel
     */
    constructor(id, json = {}) {
        super(id);

        this.invites = json.invites;
        this.lock = json.lock || {};
    }

    /**
     * get the guildID of this channel
     * @return {Promise<null|string>}
     */
    async getGuildID() {
        try {
            /** @type {module:"discord.js".GuildChannel} */
            const channel = await this.constructor.client.channels.fetch(this.id);
            return channel.guild.id;
        }
        catch (e) {
            // unknown channel, missing access
            if ([10003, 50001].includes(e.code)) {
                return null;
            }
            throw e;
        }
    }

    async _insert() {
        return this.constructor.database.query(`INSERT INTO ${this.constructor.getTableName()} (config,id,guildid) VALUES (?,?,?)`,[this.toJSONString(), this.id, await this.getGuildID()]);
    }
}

module.exports = ChannelConfig;
