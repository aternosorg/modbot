import ChatTriggeredFeature from './ChatTriggeredFeature.js';
import TypeChecker from '../settings/TypeChecker.js';
import {channelMention} from 'discord.js';
import colors from '../util/colors.js';
import ChatFeatureEmbed from '../embeds/ChatFeatureEmbed.js';

/**
 * @import {Trigger} from './triggers/Trigger.js';
 * @import {Punishment} from './Punishment.js';
 * @import {EmbedWrapper} from '../embeds/EmbedWrapper.js';
 */

/**
 * Class representing an auto response
 */
export default class AutoResponse extends ChatTriggeredFeature {

    static tableName = 'responses';

    static columns = ['guildid', 'trigger', 'response', 'global', 'channels', 'enableVision'];

    /**
     * constructor - create an auto response
     * @param {import('discord.js').Snowflake} gid guild ID
     * @param {object} json options
     * @param {Trigger} json.trigger filter that triggers the response
     * @param {string} json.response message to send to the channel
     * @param {boolean} json.global does this apply to all channels in this guild
     * @param {import('discord.js').Snowflake[]} [json.channels] channels that this applies to
     * @param {boolean} [json.enableVision] enable vision api for this auto response
     * @param {number} [id] id in DB
     * @returns {AutoResponse} the auto response
     */
    constructor(gid, json, id) {
        super(id, json.trigger);
        this.gid = gid;

        if (json) {
            this.response = json.response;
            this.global = json.global;
            this.channels = json.channels;
            this.enableVision = json.enableVision ?? false;
        }

        if (!this.channels) {
            this.channels = [];
        }
    }

    /**
     * check if the types of this object are a valid auto-response
     * @param {object} json
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

        TypeChecker.assertBooleanOrNull(json.enableVision, 'Enable Vision');
    }

    /**
     * serialize the response
     * @returns {(*|string)[]}
     */
    serialize() {
        return [this.gid, JSON.stringify(this.trigger), this.response, this.global, this.channels.join(','), this.enableVision];
    }

    /**
     * generate an Embed displaying the info of this response
     * @param {string}        title
     * @param {number}        color
     * @returns {EmbedWrapper}
     */
    embed(title = 'Auto-response', color = colors.GREEN) {
        return new ChatFeatureEmbed(this, title, color);
    }

    /**
     * create a new response
     * @param {import('discord.js').Snowflake} guildID
     * @param {boolean} global
     * @param {import('discord.js').Snowflake[]|null} channels
     * @param {string} triggerType
     * @param {string} triggerContent
     * @param {string} responseText
     * @param {?boolean} enableVision
     * @returns {Promise<{success:boolean, response: ?AutoResponse, message: ?string}>}
     */
    static async new(
        guildID,
        global,
        channels,
        triggerType,
        triggerContent,
        responseText,
        enableVision
    ) {
        let trigger = this.getTrigger(triggerType, triggerContent);
        if (!trigger.success)
            return {success: false, response: null, message: trigger.message};

        const response = new AutoResponse(guildID, {
            trigger: trigger.trigger,
            global,
            channels,
            response: responseText,
            enableVision,
        });
        await response.save();
        return {success: true, response: response, message: null};
    }

    getOverview() {
        return `[${this.id}] ${this.global ? 'global' : this.channels.map(channelMention).join(', ')} ${this.trigger.asString()}`;
    }
}
