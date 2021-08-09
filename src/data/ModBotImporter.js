const GuildConfig = require('../config/GuildConfig');
const ChannelConfig = require('../config/ChannelConfig');
const Moderation = require('../Moderation');
const AutoResponse = require('../AutoResponse');
const BadWord = require('../BadWord');
const {MessageEmbed, Client, Snowflake} = require('discord.js');
const Exporter = require('./Exporter');
const Importer = require('./Importer');

class ModBotImporter extends Importer {

    /**
     * @type {Client}
     */
    bot;

    /**
     * @type {Snowflake}
     */
    guildID;

    /**
     * @type {Exporter}
     */
    data;
    
    /**
     * @param {Client} bot
     * @param {Snowflake} guildID
     * @param {Exporter} data JSON exported data (modbot-1.0.0)
     */
    constructor(bot, guildID, data) {
        super();
        this.bot = bot;
        this.guildID = guildID;
        this.data = data;
    }

    /**
     * verify that all data is of correct types before importing
     * @throws {TypeError}
     */
    checkAllTypes() {
        GuildConfig.checkTypes(this.data.guildConfig);

        if (!(this.data.channels instanceof Array)) {
            throw new TypeError('Channels must be an array');
        }
        this.data.channels.forEach(c => ChannelConfig.checkTypes(c));

        if (!(this.data.responses instanceof Array)) {
            throw new TypeError('Responses must be an array');
        }
        this.data.responses.forEach(r => AutoResponse.checkTypes(r));

        if (!(this.data.badWords instanceof Array)) {
            throw new TypeError('BadWords must be an array');
        }
        this.data.badWords.forEach(b => BadWord.checkTypes(b));

        if (!(this.data.moderations instanceof Array)) {
            throw new TypeError('Moderations must be an array');
        }
        for (const moderation of this.data.moderations) {
            moderation.guildid = this.guildID;
            Moderation.checkTypes(moderation);
        }
    }

    /**
     * import all data to the DB
     * @return {Promise<void>}
     */
    async import() {
        await Promise.all([
            this._importGuildConfig(),
            this._importChannelConfigs(),
            this._importModerations(),
            this._importResponses(),
            this._importBadWords()
        ]);
    }

    _importGuildConfig() {
        const guildConfig = new GuildConfig(this.guildID, this.data.guildConfig);
        return guildConfig.save();
    }

    async _importChannelConfigs() {
        const channels = this.data.channels;
        return this.data.channels = await Promise.all(channels.map(c => ChannelConfig.import(this.bot, this.guildID, c)));
    }

    _importModerations() {
        const moderations = this.data.moderations;
        return Moderation.bulkSave(moderations.map(m => {
            m.guildid = this.guildID;
            return new Moderation(m);
        }));
    }

    _importResponses() {
        const responses = this.data.responses;
        return Promise.all(responses.map(r => (new AutoResponse(this.guildID, r)).save()));
    }

    _importBadWords() {
        const badWords = this.data.badWords;
        return Promise.all(badWords.map(b => (new BadWord(this.guildID, b)).save()));
    }

    generateEmbed() {
        return new MessageEmbed()
            .setTitle('Imported Data')
            .addField('Channel Configs', this.data.channels.filter(c => c === true).length.toString(), true)
            .addField('Moderations', this.data.moderations.length.toString(), true)
            .addField('Responses', this.data.responses.length.toString(), true)
            .addField('BadWords', this.data.badWords.length.toString(), true);
    }
}

module.exports = ModBotImporter;