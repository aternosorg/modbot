import Importer from './Importer.js';
import GuildSettings from '../../settings/GuildSettings.js';
import ChannelSettings from '../../settings/ChannelSettings.js';
import AutoResponse from '../AutoResponse.js';
import BadWord from '../BadWord.js';
import Moderation from '../Moderation.js';
import {EmbedBuilder} from 'discord.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import {asyncFilter} from '../../util/util.js';

/**
 * @import {Client, Snowflake} from 'discord.js';
 * @import {Exporter} from './Exporter.js';
 */

export default class ModBotImporter extends Importer {

    /**
     * @type {Client}
     */
    bot;

    /**
     * @type {import('discord.js').Snowflake}
     */
    guildID;

    /**
     * @type {Exporter}
     */
    data;
    
    /**
     * @param {import('discord.js').Snowflake} guildID
     * @param {Exporter} data JSON exported data (modbot-1.0.0)
     */
    constructor(guildID, data) {
        super();
        this.guildID = guildID;
        this.data = data;
    }

    /**
     * verify that all data is of correct types before importing
     * @throws {TypeError}
     */
    checkAllTypes() {
        GuildSettings.checkTypes(this.data.guildConfig);

        if (!(this.data.channels instanceof Array)) {
            throw new TypeError('Channels must be an array');
        }
        this.data.channels.forEach(c => ChannelSettings.checkTypes(c));

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
     * @returns {Promise<void>}
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

    async _importGuildConfig() {
        const guildWrapper = await GuildWrapper.fetch(this.guildID);
        for (const key of ['logChannel', 'messageLogChannel', 'joinLogChannel']) {
            const id = this.data.guildConfig[key];
            if (id && !await guildWrapper.fetchChannel(id)) {
                this.data.guildConfig[key] = null;
            }
        }

        if (!await guildWrapper.fetchRole(this.data.guildConfig.mutedRole)) {
            this.data.guildConfig.mutedRole = null;
        }
        this.data.guildConfig.protectedRoles = await asyncFilter(this.data.guildConfig.protectedRoles, async id => {
            return !!await guildWrapper.fetchRole(id);
        });

        const guildConfig = new GuildSettings(this.guildID, this.data.guildConfig);
        await guildConfig.save();
        GuildSettings.getCache().set(this.guildID, guildConfig);
    }

    async _importChannelConfigs() {
        const channels = this.data.channels;
        this.data.channels = await Promise.all(channels.map(c => ChannelSettings.import(this.guildID, c)));

        for (const channel of this.data.channels) {
            ChannelSettings.getCache().set(channel.id, channel);
        }
    }

    _importModerations() {
        const moderations = this.data.moderations;
        return Moderation.bulkSave(moderations.map(m => {
            m.guildid = this.guildID;
            return new Moderation(m);
        }));
    }

    async _importResponses() {
        const responses = this.data.responses;
        await Promise.all(responses.map(r => (new AutoResponse(this.guildID, r)).save()));
        AutoResponse.getGuildCache().delete(this.guildID);
        const channelCache = AutoResponse.getChannelCache();
        for (const channel of responses.map(r => r.channels).flat()) {
            channelCache.delete(channel);
        }
    }

    async _importBadWords() {
        const badWords = this.data.badWords;
        await Promise.all(badWords.map(b => (new BadWord(this.guildID, b)).save()));
        BadWord.getGuildCache().delete(this.guildID);
        const channelCache = BadWord.getChannelCache();
        for (const channel of badWords.map(b => b.channels).flat()) {
            channelCache.delete(channel);
        }
    }

    generateEmbed() {
        return new EmbedBuilder()
            .setTitle('Imported Data')
            .addFields(
                /** @type {any} */{ name: 'Channel Configs', value: this.data.channels.filter(c => c !== null).length.toString(), inline: true },
                /** @type {any} */{ name: 'Moderations', value: this.data.moderations.length.toString(), inline: true },
                /** @type {any} */{ name: 'Responses', value: this.data.responses.length.toString(), inline: true },
                /** @type {any} */{ name: 'BadWords', value: this.data.badWords.length.toString(), inline: true },
            );
    }
}