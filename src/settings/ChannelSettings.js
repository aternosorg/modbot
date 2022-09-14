import TypeChecker from './TypeChecker.js';
import {RESTJSONErrorCodes} from 'discord.js';
import Settings from './Settings.js';
import Database from '../bot/Database.js';
import Bot from '../bot/Bot.js';

/**
 * Class representing the settings of a channel
 */
export default class ChannelSettings extends Settings {

    static tableName = 'channels';

    invites;

    lock;

    /**
     * Constructor - create a channel settings
     *
     * @param  {import('discord.js').Snowflake}  id             channel id
     * @param  {Object}                         [json]          options
     * @param  {Boolean}                        [json.invites]  allow invites
     * @param  {Object}                         [json.lock]     permissions before locking (only affected perms)
     * @return {ChannelSettings} the settings of the channel
     */
    constructor(id, json = {}) {
        super(id);

        this.invites = json.invites ?? null;
        this.lock = json.lock || {};
    }

    /**
     * check if the types of this object are a valid guild settings
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
     * @param {import('discord.js').Snowflake} guildID
     * @return {Promise<ChannelSettings[]>}
     */
    static async getForGuild(guildID) {
        const result = [];
        for (const {id, config} of await Database.instance.queryAll('SELECT id, config FROM channels WHERE guildid = ?', [guildID])) {
            result.push(new ChannelSettings(id, JSON.parse(config)));
        }
        return result;
    }

    /**
     * get the guildID of this channel
     * @return {Promise<null|string>}
     */
    async getGuildID() {
        try {
            const channel = await Bot.instance.client.channels.fetch(this.id);
            return channel.guild.id;
        }
        catch (e) {
            if ([RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.MissingAccess].includes(e.code)) {
                return null;
            }
            throw e;
        }
    }

    async insert() {
        return Database.instance.query('INSERT INTO channels (config,id,guildid) VALUES (?,?,?)',
            this.toJSONString(), this.id, await this.getGuildID());
    }

    /**
     * @param {import('discord.js').Snowflake} guildID
     * @param {Settings} data
     * @return {Promise<?ChannelSettings>}
     */
    static async import(guildID, data) {
        let channel;
        try {
            channel = await Bot.instance.client.channels.fetch(data.id);
        }
        catch (e) {
            return null;
        }

        if (channel.guild.id !== guildID) return null;

        const config = new this(data.id, data);
        await config.save();
        return config;
    }
}
