import Importer from './Importer.js';
import TypeChecker from '../../settings/TypeChecker.js';
import Moderation from '../Moderation.js';
import {EmbedBuilder} from 'discord.js';

/***
 * @typedef {Object} VortexModeration
 * @property {number} value
 * @property {import('discord.js').Snowflake} id
 */

export default class VortexImporter extends Importer {
    /**
     * key: userid
     * value: timestamp
     * @type {Object}
     */
    tempmutes;

    /**
     * key: userid
     * value: strike count
     * @type {Object}
     */
    strikes;

    /**
     * key: userid
     * value: timestamp
     * @type {Object}
     */
    tempbans;

    /**
     * @param {Client} bot
     * @param {import('discord.js').Snowflake} guildID
     * @param {Object} data JSON exported data from vortex
     * @param {Object} data.tempmutes
     * @param {Object} data.strikes
     * @param {Object} data.tempbans
     */
    constructor(bot, guildID, data) {
        super();
        this.bot = bot;
        this.guildID = guildID;
        this.tempmutes = data.tempmutes;
        this.strikes = data.strikes;
        this.tempbans = data.tempbans;
    }

    /**
     * @param {Object} object
     * @return {VortexModeration[]}
     */
    keyValueArray(object) {
        const result = [];
        const ids = Object.keys(object);
        for (const id of ids) {
            result.push({id, value: object[id]});
        }
        return result;
    }

    /**
     * verify that all data is of correct types before importing
     * @throws {TypeError}
     */
    checkAllTypes() {
        Object.keys(this.tempbans).forEach(id => TypeChecker.assertString(id, 'User ID'));
        Object.values(this.tempbans).forEach(value => value < Number.MAX_SAFE_INTEGER && TypeChecker.assertNumber(value, 'Expire Time'));
        Object.keys(this.tempmutes).forEach(id => TypeChecker.assertString(id, 'User ID'));
        Object.values(this.tempmutes).forEach(value => value < Number.MAX_SAFE_INTEGER && TypeChecker.assertNumber(value, 'Expire Time'));
        Object.keys(this.strikes).forEach(id => TypeChecker.assertString(id, 'User ID'));
        Object.values(this.strikes).forEach(value => value < Number.MAX_SAFE_INTEGER && TypeChecker.assertNumber(value, 'Expire Time'));
    }

    async import() {
        return Promise.all([
            this._importTempmutes(),
            this._importStrikes(),
            this._importTempbans()
        ]);
    }

    async _importTempmutes() {
        const mutes = this.keyValueArray(this.tempmutes).filter(e => e.value < Number.MAX_SAFE_INTEGER);
        return Moderation.bulkSave(mutes.map(m => this._timedModeration(m, 'mute')));
    }

    async _importStrikes() {
        const strikes = this.keyValueArray(this.strikes).filter(e => e.value < Number.MAX_SAFE_INTEGER);
        return Moderation.bulkSave(strikes.map(m => this._strike(m)));
    }

    async _importTempbans() {
        const bans = this.keyValueArray(this.tempbans).filter(e => e.value < Number.MAX_SAFE_INTEGER);
        return Moderation.bulkSave(bans.map(m => this._timedModeration(m, 'ban')));
    }

    /**
     * @param {VortexModeration} moderation
     * @param {String} type
     * @return {Moderation}
     */
    _timedModeration(moderation, type) {
        return new Moderation({
            guildid: this.guildID,
            userid: moderation.id,
            action: type,
            expireTime: moderation.value,
            reason: /** @type {String} */'Imported from Vortex',
            moderator: this.bot.user.id
        });
    }

    /**
     * @param {VortexModeration} moderation
     * @return {Moderation}
     * @private
     */
    _strike(moderation) {
        return new Moderation({
            guildid: this.guildID,
            userid: moderation.id,
            value: moderation.value,
            action: 'strike',
            reason: 'Imported from Vortex',
            moderator: this.bot.user.id
        });
    }

    generateEmbed() {
        return new EmbedBuilder()
            .setTitle('Imported Data')
            .addFields(
                /** @type {any} */ { name: 'Mutes', value: Object.keys(this.tempmutes).length.toString(), inline: true},
                /** @type {any} */ { name: 'Strikes', value: Object.keys(this.strikes).length.toString(), inline: true},
                /** @type {any} */ { name: 'Bans', value: Object.keys(this.tempbans).length.toString(), inline: true},
            );
    }
}
