import ChatTriggeredFeature from './ChatTriggeredFeature.js';
import TypeChecker from '../settings/TypeChecker.js';
import {channelMention} from 'discord.js';
import Punishment from './Punishment.js';
import {yesNo} from '../util/format.js';
import {EMBED_FIELD_LIMIT} from '../util/apiLimits.js';
import colors from '../util/colors.js';
import KeyValueEmbed from '../embeds/KeyValueEmbed.js';

/**
 * Class representing a bad word
 */
export default class BadWord extends ChatTriggeredFeature {

    static punishmentTypes = ['none', 'ban', 'kick', 'mute', 'softban', 'strike', 'dm'];

    static defaultResponse = 'Your message includes words/phrases that are not allowed here!';

    static tableName = 'badWords';

    static columns = ['guildid', 'trigger', 'punishment', 'response', 'global', 'channels', 'priority'];

    /**
     * constructor - create a bad word
     * @param {import('discord.js').Snowflake} gid guild ID
     * @param {Object} json options
     * @param {Trigger} json.trigger filter that triggers the bad word
     * @param {String|Punishment} json.punishment punishment for the members which trigger this
     * @param {String} [json.response] a message that is sent by this filter. It's automatically deleted after 5 seconds
     * @param {Boolean} json.global does this apply to all channels in this guild
     * @param {import('discord.js').Snowflake[]} [json.channels] channels that this applies to
     * @param {Number} [json.priority] badword priority (higher -> more important)
     * @param {Number} [id] id in DB
     * @return {BadWord}
     */
    constructor(gid, json, id) {
        super(id, json.trigger);
        this.gid = gid;

        if (json) {
            this.punishment = typeof (json.punishment) === 'string' ? JSON.parse(json.punishment) : json.punishment;
            this.response = json.response;
            if (this.punishment?.action?.toUpperCase?.() === 'DM' && this.response && this.response !== 'disabled') {
                if (this.response === 'default') {
                    this.punishment.message = BadWord.defaultResponse;
                } else {
                    this.punishment.message = this.response;
                }
            }
            this.global = json.global;
            this.channels = json.channels;
            this.priority = json.priority || 0;
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

        TypeChecker.assertStringUndefinedOrNull(json.response, 'Response');
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

        TypeChecker.assertNumberUndefinedOrNull(json.priority, 'Priority');
    }

    /**
     * serialize the bad word
     * @returns {(*|string)[]}
     */
    serialize() {
        return [this.gid, JSON.stringify(this.trigger), JSON.stringify(this.punishment), this.response, this.global, this.channels.join(','), this.priority];
    }

    /**
     * generate an Embed displaying the info of this bad word
     * @param {String}        title
     * @param {Number}        color
     * @returns {EmbedWrapper}
     */
    embed(title = 'Bad-word', color = colors.GREEN) {
        const duration = this.punishment.duration;
        return new KeyValueEmbed()
            .setTitle(title + ` [${this.id}]`)
            .setColor(color)
            .addPair('Trigger', this.trigger.asString())
            .addPair('Global', yesNo(this.global))
            .addPairIf(!this.global, 'Channels', this.channels.map(channelMention).join(', '))
            .addPair('Punishment', `${this.punishment.action} ${duration ? `for ${duration}` : ''}`)
            .addPair('Priority', this.priority)
            .addFields(
                /** @type {any} */
                {
                    name: 'Response',
                    value: this.response.substring(0, EMBED_FIELD_LIMIT)
                },
            );
    }

    /**
     * create a new bad word
     * @param {import('discord.js').Snowflake} guildID
     * @param {boolean} global
     * @param {import('discord.js').Snowflake[]|null} channels
     * @param {String} triggerType
     * @param {String} triggerContent
     * @param {String} [response] response to bad-word
     * @param {?string} punishment
     * @param {?number} duration
     * @param {?number} priority
     * @returns {Promise<{success:boolean, badWord: ?BadWord, message: ?string}>}
     */
    static async new(guildID, global, channels, triggerType, triggerContent, response, punishment, duration, priority) {
        let trigger = this.getTrigger(triggerType, triggerContent);
        if (!trigger.success)
            return {success: false, badWord: null, message: trigger.message};

        const badWord = new BadWord(guildID, {
            trigger: trigger.trigger,
            punishment: new Punishment({action: punishment ?? 'none', duration: duration}),
            global,
            channels,
            response: response || 'disabled',
            priority,
        });
        await badWord.save();
        return {success: true, badWord, message: null};
    }
    getOverview() {
        return `[${this.id}] ${this.global ? 'global' : this.channels.map(channelMention).join(', ')} ${this.trigger.asString()}`;
    }

    getResponse() {
        return this.response === 'default' ? BadWord.defaultResponse : this.response;
    }
}
