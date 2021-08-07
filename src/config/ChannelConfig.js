const Config = require('./Config');
const {Constants, Snowflake, GuildChannel, Client} = require('discord.js');
const {APIErrors} = Constants;
const TypeChecker = require('./TypeChecker');

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
     * @param  {Snowflake}  id             channel id
     * @param  {Object}                         [json]          options
     * @param  {Boolean}                        [json.invites]  allow invites
     * @param  {Object}                         [json.lock]     permissions before locking (only affected perms)
     * @return {ChannelConfig} the config of the channel
     */
    constructor(id, json = {}) {
        super(id);

        this.invites = json.invites ?? null;
        this.lock = json.lock || {};
    }

    /**
     * check if the types of this object are a valid guild config
     * @param {Object} json
     * @throws {TypeError} incorrect types
     */
    static checkTypes(json) {
        TypeChecker.assertOfTypes(json, ['object'], 'Data object');

        TypeChecker.assertOfTypes(json.invites, ['undefined','boolean'], 'Invites', true);
        TypeChecker.assertOfTypes(json.lock, ['object'], 'Lock');
    }

    /**
     * get all channel configs from this guild
     * @param {Snowflake} guildID
     * @return {Promise<ChannelConfig[]>}
     */
    static async getForGuild(guildID) {
        const result = [];
        for (const {id, config} of await this.database.queryAll('SELECT id, config FROM channels WHERE guildid = ?', [guildID])) {
            result.push(new ChannelConfig(id, JSON.parse(config)));
        }
        return result;
    }

    /**
     * get the guildID of this channel
     * @return {Promise<null|string>}
     */
    async getGuildID() {
        try {
            /** @type {GuildChannel} */
            const channel = await this.constructor.client.channels.fetch(this.id);
            return channel.guild.id;
        }
        catch (e) {
            if ([APIErrors.UNKNOWN_CHANNEL, APIErrors.MISSING_ACCESS].includes(e.code)) {
                return null;
            }
            throw e;
        }
    }

    async _insert() {
        return this.constructor.database.query(`INSERT INTO ${this.constructor.getTableName()} (config,id,guildid) VALUES (?,?,?)`,[this.toJSONString(), this.id, await this.getGuildID()]);
    }

    /**
     * @param {Client} bot
     * @param {Snowflake} guildID
     * @param {Config} data
     * @return {Promise<void>}
     */
    static async import(bot, guildID, data) {
        let channel;
        try {
            channel = await bot.channels.fetch(data.id);
        }
        catch (e) {
            return false;
        }

        if (channel.guild.id !== guildID) return false;

        await (new this(data.id, data)).save();
        return true;
    }
}

module.exports = ChannelConfig;
