import ChatTriggeredFeature from './ChatTriggeredFeature.js';
import TypeChecker from '../settings/TypeChecker.js';
import {channelMention} from 'discord.js';
import Punishment, {PunishmentAction} from './Punishment.js';
import colors from '../util/colors.js';
import ChatFeatureEmbed from '../embeds/ChatFeatureEmbed.js';
import {EMBED_FIELD_LIMIT} from '../util/apiLimits.js';

/**
 * @import {Trigger} from './triggers/Trigger.js';
 * @import {Punishment} from './Punishment.js';
 * @import {EmbedWrapper} from '../embeds/EmbedWrapper.js';
 */

/**
 * Class representing a bad word
 */
export default class BadWord extends ChatTriggeredFeature {
    static defaultResponse = 'Your message includes words/phrases that are not allowed here!';

    static tableName = 'badWords';

    static columns = [
        'guildid',
        'trigger',
        'punishment',
        'response',
        'global',
        'channels',
        'priority',
        'enableVision',
        'dm',
    ];

    /**
     * constructor - create a bad word
     * @param {import('discord.js').Snowflake} gid guild ID
     * @param {object} json options
     * @param {Trigger} json.trigger filter that triggers the bad word
     * @param {string|Punishment} json.punishment punishment for the members which trigger this
     * @param {string} [json.response] a message that is sent by this filter. It's automatically deleted after 5 seconds
     * @param {boolean} json.global does this apply to all channels in this guild
     * @param {import('discord.js').Snowflake[]} [json.channels] channels that this applies to
     * @param {number} [json.priority] badword priority (higher -> more important)
     * @param {?string} [json.dm] direct message to send to the user
     * @param {boolean} [json.enableVision] enable vision api for this badword
     * @param {number} [id] id in DB
     * @returns {BadWord}
     */
    constructor(gid, json, id) {
        super(id, json.trigger);
        this.gid = gid;

        if (json) {
            this.punishment = typeof (json.punishment) === 'string' ? JSON.parse(json.punishment) : json.punishment;
            this.response = json.response;
            this.global = json.global;
            this.channels = json.channels;
            this.priority = json.priority || 0;
            this.enableVision = json.enableVision ?? false;
            this.dm = json.dm;
        }

        if (!this.channels) {
            this.channels = [];
        }

        // Temporary for migrating dm 'punishments' to the new dm field
        if (this.punishment?.action?.toUpperCase?.() === 'DM') {
            this.dm = this.punishment.message;
            if (this.response === 'default') {
                this.dm ??= BadWord.defaultResponse;
            } else {
                this.dm ??= this.response;
            }
            this.punishment.message = undefined;
            this.punishment.action = PunishmentAction.NONE;
            this.response = 'disabled';
        }
    }


    /**
     * check if the types of this object are a valid auto-response
     * @param {object} json
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
        TypeChecker.assertBooleanOrNull(json.enableVision, 'Enable Vision');
    }

    /**
     * serialize the bad word
     * @returns {(*|string)[]}
     */
    serialize() {
        return [
            this.gid,
            JSON.stringify(this.trigger),
            JSON.stringify(this.punishment),
            this.response,
            this.global,
            this.channels.join(','),
            this.priority,
            this.enableVision,
            this.dm,
        ];
    }

    /**
     * generate an Embed displaying the info of this bad word
     * @param {string}        title
     * @param {number}        color
     * @returns {EmbedWrapper}
     */
    embed(title = 'Bad-word', color = colors.GREEN) {
        const duration = this.punishment.duration;
        return new ChatFeatureEmbed(this, title, color)
            .addPair('Punishment', `${this.punishment.action} ${duration ? `for ${duration}` : ''}`)
            .addPair('Priority', this.priority)
            .addFieldIf(this.dm, 'DM', this.dm?.substring(0, EMBED_FIELD_LIMIT));
    }

    /**
     * create a new bad word
     * @param {import('discord.js').Snowflake} guildID
     * @param {boolean} global
     * @param {import('discord.js').Snowflake[]|null} channels
     * @param {string} triggerType
     * @param {string} triggerContent
     * @param {string} [response] response to bad-word
     * @param {?string} punishment
     * @param {?number} duration
     * @param {?number} priority
     * @param {?string} dm
     * @param {?boolean} enableVision
     * @returns {Promise<{success:boolean, badWord: ?BadWord, message: ?string}>}
     */
    static async new(
        guildID,
        global,
        channels,
        triggerType,
        triggerContent,
        response,
        punishment,
        duration,
        priority,
        dm,
        enableVision,
    ) {
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
            dm,
            enableVision,
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
