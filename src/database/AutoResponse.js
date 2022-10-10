import ChatTriggeredFeature from './ChatTriggeredFeature.js';
import TypeChecker from '../settings/TypeChecker.js';
import {channelMention} from 'discord.js';
import KeyValueEmbed from '../embeds/KeyValueEmbed.js';
import {yesNo} from '../util/format.js';
import {EMBED_FIELD_LIMIT} from '../util/apiLimits.js';
import colors from '../util/colors.js';

/**
 * Class representing an auto response
 */
export default class AutoResponse extends ChatTriggeredFeature {

    static tableName = 'responses';

    static columns = ['guildid', 'trigger', 'response', 'global', 'channels'];

    /**
     * constructor - create an auto response
     * @param {import('discord.js').Snowflake} gid guild ID
     * @param {Object} json options
     * @param {Trigger} json.trigger filter that triggers the response
     * @param {String} json.response message to send to the channel
     * @param {Boolean} json.global does this apply to all channels in this guild
     * @param {import('discord.js').Snowflake[]} [json.channels] channels that this applies to
     * @param {Number} [id] id in DB
     * @return {AutoResponse} the auto response
     */
    constructor(gid, json, id) {
        super(id, json.trigger);
        this.gid = gid;

        if (json) {
            this.response = json.response;
            this.global = json.global;
            this.channels = json.channels;
        }

        if (!this.channels) {
            this.channels = [];
        }
    }

    /**
     * check if the types of this object are a valid auto-response
     * @param {Object} json
     */
    static checkTypes(json) {
        TypeChecker.assertOfTypes(json, ['object'], 'Data object');

        TypeChecker.assertString(json.response, 'Response');
        TypeChecker.assertOfTypes(json.global, ['boolean'], 'Global');
        if (json.global && !(json.channels instanceof Array && json.channels.every(c => typeof c === 'string'))) {
            throw new TypeError('Channels must be an array of strings');
        }

        TypeChecker.assertOfTypes(json.trigger, ['object'], 'Data object');
        if (!this.triggerTypes.includes(json.trigger.type)) {
            throw new TypeError('Invalid trigger type!');
        }
        TypeChecker.assertString(json.trigger.content, 'Content');
        TypeChecker.assertStringUndefinedOrNull(json.trigger.flags, 'Flags');
    }

    /**
     * serialize the response
     * @returns {(*|string)[]}
     */
    serialize() {
        return [this.gid, JSON.stringify(this.trigger), this.response, this.global, this.channels.join(',')];
    }

    /**
     * generate an Embed displaying the info of this response
     * @param {String}        title
     * @param {Number}        color
     * @returns {EmbedWrapper}
     */
    embed(title = 'Auto-response', color = colors.GREEN) {
        return new KeyValueEmbed()
            .setTitle(title + ` [${this.id}]`)
            .setColor(color)
            .addPair('Trigger', this.trigger.asString())
            .addPair('Global', yesNo(this.global))
            .addPairIf(!this.global, 'Channels', this.channels.map(channelMention).join(', '))
            .addFields(
                /** @type {any} */
                {
                    name: 'Response',
                    value: this.response.substring(0, EMBED_FIELD_LIMIT)
                },
            );
    }

    /**
     * create a new response
     * @param {import('discord.js').Snowflake} guildID
     * @param {boolean} global
     * @param {import('discord.js').Snowflake[]|null} channels
     * @param {String} triggerType
     * @param {String} triggerContent
     * @param {String} responseText
     * @returns {Promise<{success:boolean, response: ?AutoResponse, message: ?string}>}
     */
    static async new(guildID, global, channels, triggerType, triggerContent, responseText) {
        let trigger = this.getTrigger(triggerType, triggerContent);
        if (!trigger.success)
            return {success: false, response: null, message: trigger.message};

        const response = new AutoResponse(guildID, {
            trigger: trigger.trigger,
            global,
            channels,
            response: responseText
        });
        await response.save();
        return {success: true, response: response, message: null};
    }

    getOverview() {
        return `[${this.id}] ${this.global ? 'global' : this.channels.map(c => `<#${c}>`).join(', ')} ${this.trigger.asString()}`;
    }
}
