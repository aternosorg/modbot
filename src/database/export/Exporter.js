import GuildSettings from '../../settings/GuildSettings.js';
import ChannelSettings from '../../settings/ChannelSettings.js';
import Moderation from '../Moderation.js';
import AutoResponse from '../AutoResponse.js';
import BadWord from '../BadWord.js';

/**
 * @import {ChatTriggeredFeature} from '../ChatTriggeredFeature.js';
 * @import {GuildSettingsJSON} from '../../settings/GuildSettings.js';
 */

export default class Exporter {

    /**
     * @type {string}
     */
    dataType = 'modbot-1.0.0';

    /**
     * @type {GuildSettingsJSON}
     */
    guildConfig;

    /**
     * @type {ChannelSettings[]}
     */
    channels;

    /**
     * @type {import('discord.js').Snowflake}
     */
    guildID;

    /**
     * @type {ChatTriggeredFeature[]}
     */
    responses;

    /**
     * @type {ChatTriggeredFeature[]}
     */
    badWords;

    /**
     * @type {Moderation[]}
     */
    moderations;

    /**
     * @param {import('discord.js').Snowflake} guildID
     */
    constructor(guildID) {
        this.guildID = guildID;
    }

    /**
     * get all data of this guild as a JSON string
     * @returns {Promise<string>}
     */
    async export() {
        await Promise.all([
            this._getGuildConfig(),
            this._getChannelConfigs(),
            this._getModerations(),
            this._getResponses(),
            this._getBadWords()
        ]);

        return JSON.stringify(this, null, 2);
    }

    async _getGuildConfig() {
        this.guildConfig = (await GuildSettings.get(this.guildID)).getDataObject();
    }

    async _getChannelConfigs() {
        this.channels = (await ChannelSettings.getForGuild(this.guildID)).map(c => c.getDataObject());
    }

    async _getModerations() {
        this.moderations = await Moderation.getAll(this.guildID);
    }

    async _getResponses() {
        this.responses = Array.from((await AutoResponse.getAll(this.guildID)).values());
    }

    async _getBadWords() {
        this.badWords = Array.from((await BadWord.getAll(this.guildID)).values());
    }
}
