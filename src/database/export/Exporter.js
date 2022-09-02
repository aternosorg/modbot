const GuildConfig = require('../../config/GuildConfig.js');
const ChannelConfig = require('../../config/ChannelConfig.js');
const Moderation = require('../Moderation.js');
const AutoResponse = require('../AutoResponse.js');
const BadWord = require('../BadWord.js');
const {Snowflake} = require('discord.js');

class Exporter {

    /**
     * @type {string}
     */
    dataType = 'modbot-1.0.0';

    /**
     * @type {GuildConfig}
     */
    guildConfig;

    /**
     * @type {ChannelConfig[]}
     */
    channels;

    /**
     * @type {Snowflake}
     */
    guildID;

    /**
     * @type {AutoResponse[]}
     */
    responses;

    /**
     * @type {BadWord[]}
     */
    badWords;

    /**
     * @type {Moderation[]}
     */
    moderations;

    /**
     * @param guildID
     */
    constructor(guildID) {
        this.guildID = guildID;
    }

    /**
     * get all data of this guild as a JSON string
     * @return {Promise<string>}
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
        this.guildConfig = (await GuildConfig.get(this.guildID)).getDataObject();
    }

    async _getChannelConfigs() {
        this.channels = (await ChannelConfig.getForGuild(this.guildID)).map(c => c.getDataObject());
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

module.exports = Exporter;