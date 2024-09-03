import TypeChecker from './TypeChecker.js';
import {RESTJSONErrorCodes} from 'discord.js';
import Settings from './Settings.js';
import database from '../bot/Database.js';
import bot from '../bot/Bot.js';

/**
 * Class representing the settings of a channel
 */
export default class ChannelSettings extends Settings {

    static tableName = 'channels';

    invites;

    lock;

    /**
     * @param  {import('discord.js').Snowflake}  id             channel id
     * @param  {object}                         [json]          options
     * @param  {boolean}                        [json.invites]  allow invites
     * @param  {object}                         [json.lock]     permissions before locking (only affected perms)
     * @returns {ChannelSettings} the settings of the channel
     */
    constructor(id, json = {}) {
        super(id);

        this.invites = json.invites ?? null;
        this.lock = json.lock ?? {};
    }

    /**
     * check if the types of this object are a valid guild settings
     * @param {object} json
     * @throws {TypeError} incorrect types
     */
    static checkTypes(json) {
        TypeChecker.assertOfTypes(json, ['object'], 'Data object');

        TypeChecker.assertOfTypes(json.invites, ['undefined','boolean'], 'Invites', true);
        TypeChecker.assertOfTypes(json.lock, ['object'], 'Lock', true);
    }

    /**
     * get all channel configs from this guild
     * @param {import('discord.js').Snowflake} guildID
     * @returns {Promise<ChannelSettings[]>}
     */
    static async getForGuild(guildID) {
        const result = [];
        for (const {id, config} of await database.queryAll('SELECT id, config FROM channels WHERE guildid = ?', [guildID])) {
            result.push(new ChannelSettings(id, JSON.parse(config)));
        }
        return result;
    }

    /**
     * get the guildID of this channel
     * @returns {Promise<null|string>}
     */
    async getGuildID() {
        try {
            const channel = await bot.client.channels.fetch(this.id);
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
        return database.query('INSERT INTO channels (config,id,guildid) VALUES (?,?,?)',
            this.toJSONString(), this.id, await this.getGuildID());
    }

    /**
     * @param {import('discord.js').Snowflake} guildID
     * @param {Settings} data
     * @returns {Promise<?ChannelSettings>}
     */
    static async import(guildID, data) {
        let channel;
        try {
            channel = await bot.client.channels.fetch(data.id);
        }
        catch {
            return null;
        }

        if (channel.guild.id !== guildID) return null;

        const config = new this(data.id, data);
        await config.save();
        return config;
    }
}
