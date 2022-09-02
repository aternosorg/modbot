const ChatTriggeredFeature = require('./ChatTriggeredFeature.js');
const {
    Snowflake,
    MessageEmbed,
    Guild,
} = require('discord.js');
const {Punishment} = require('../Typedefs.js');
const Trigger = require('./Trigger.js');
const util = require('../util.js');
const TypeChecker = require('../config/TypeChecker.js');

/**
 * Class representing a bad word
 */
class BadWord extends ChatTriggeredFeature {

    static punishmentTypes = ['none', 'ban', 'kick', 'mute', 'softban', 'strike', 'dm'];

    static defaultResponse = 'Your message includes words/phrases that are not allowed here!';

    static tableName = 'badWords';

    static columns = ['guildid', 'trigger', 'punishment', 'response', 'global', 'channels', 'priority'];

    /**
     * constructor - create a bad word
     * @param {Snowflake} gid guild ID
     * @param {Object} json options
     * @param {Trigger} json.trigger filter that triggers the bad word
     * @param {String|Punishment} json.punishment punishment for the members which trigger this
     * @param {String} [json.response] a message that is send by this filter. It's automatically deleted after 5 seconds
     * @param {Boolean} json.global does this apply to all channels in this guild
     * @param {Snowflake[]} [json.channels] channels that this applies to
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
            if (this.punishment && this.punishment.action === 'dm' && this.response && this.response !== 'disabled') {
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
     * @returns {MessageEmbed}
     */
    embed(title, color) {
        const duration = this.punishment.duration, trigger = this.trigger;
        return new MessageEmbed()
            .setTitle(title + ` [${this.id}]`)
            .setColor(color)
            .addFields(
                /** @type {any} */[
                    {
                        name: 'Trigger',
                        value: `${trigger.type}: \`${trigger.type === 'regex' ? '/' + trigger.content + '/' + trigger.flags : trigger.content}\``.substring(0, 1000),
                        inline: true
                    },
                    {
                        name: 'Response',
                        value: this.response === 'default' ? BadWord.defaultResponse : this.response.substring(0, 1000),
                        inline: true
                    },
                    {
                        name: 'Channels',
                        value: this.global ? 'global' : this.channels.map(c => `<#${c}>`).join(', ').substring(0, 1000),
                        inline: true
                    },
                    {
                        name: 'Punishment',
                        value: `${this.punishment.action} ${duration ? `for ${duration}` : ''}`,
                        inline: true
                    },
                    {
                        name: 'Priority',
                        value: this.priority.toString(),
                        inline: true
                    },
                ]);
    }

    /**
     * create a new bad word
     * @param {Snowflake} guildID
     * @param {boolean} global
     * @param {Snowflake[]|null} channels
     * @param {String} triggerType
     * @param {String} triggerContent
     * @param {String} [response] response to bad-word
     * @returns {Promise<{success:boolean, badWord: BadWord, message: String}>}
     */
    static async new(guildID, global, channels, triggerType, triggerContent, response) {
        let trigger = this.getTrigger(triggerType, triggerContent);
        if (!trigger.success) return trigger;

        const badWord = new BadWord(guildID, {
            trigger: trigger.trigger,
            punishment: {action: 'none'},
            global,
            channels,
            response: response ?? 'disabled',
        });
        await badWord.save();
        return {success: true, badWord};
    }

    /**
     * edit this badword
     * @param {String} option option to change
     * @param {String[]} args
     * @param {Guild} guild
     * @returns {Promise<{success: boolean, message: String}>} response message
     */
    async edit(option, args, guild) {
        switch (option) {
            case 'trigger': {
                let trigger = this.constructor.getTrigger(args.shift(), args.join(' '));
                if (!trigger.success) return {success: false, message:trigger.message};
                this.trigger = trigger.trigger;
                await this.save();
                return {success: true, message:'Successfully changed trigger'};
            }

            case 'response': {
                let response = args.join(' ');
                if (!response) response = 'disabled';

                this.response = response;
                await this.save();
                return {success: true, message:`Successfully ${response === 'disabled' ? 'disabled' : 'changed'} response`};
            }

            case 'punishment': {
                let action = args.shift().toLowerCase(),
                    duration = args.join(' ');
                if (!this.constructor.punishmentTypes.includes(action)) return {success: false, message:'Unknown punishment'};
                this.punishment = {action, duration};
                await this.save();
                return {success: true, message:`Successfully ${action === 'none' ? 'disabled' : 'changed'} punishment`};
            }

            case 'priority': {
                let priority = parseInt(args.shift());
                if (Number.isNaN(priority)) return {success: false, message:'Invalid priority'};
                this.priority = priority;
                await this.save();
                return {success: true, message:`Successfully changed priority to ${priority}`};
            }

            case 'channels': {
                if (args[0].toLowerCase() === 'global') {
                    this.global = true;
                    this.channels = [];
                }
                else {
                    let channels = util.channelMentions(guild, args);
                    if (!channels) return {success: false, message:'No valid channels specified'};
                    this.global = false;
                    this.channels = channels;
                }
                await this.save();
                return {success: true, message: global ? 'Successfully made this badword global' : 'Successfully changed channels'};
            }

            default: {
                return {success: false, message:'Unknown option'};
            }
        }
    }

    getOverview() {
        return `[${this.id}] ${this.global ? 'global' : this.channels.map(c => `<#${c}>`).join(', ')} ` +
            '`' + this.trigger.asString() + '`\n';
    }
}

module.exports = BadWord;
