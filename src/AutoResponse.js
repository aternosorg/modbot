const ChatTriggeredFeature = require('./ChatTriggeredFeature');
const Discord = require('discord.js');
const util = require('./util');

/**
 * Class representing an auto response
 */
class AutoResponse extends ChatTriggeredFeature {

    static tableName = 'responses';

    static columns = ['guildid', 'trigger', 'response', 'global', 'channels'];

    /**
     * constructor - create an auto response
     * @param {module:"discord.js".Snowflake}     gid               guild ID
     * @param {Object}                            json              options
     * @param {Trigger}                           json.trigger      filter that triggers the response
     * @param {String}                            json.response     message to send to the channel
     * @param {Boolean}                           json.global       does this apply to all channels in this guild
     * @param {module:"discord.js".Snowflake[]}   [json.channels]   channels that this applies to
     * @param {Number}                            [id]              id in DB
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
     * @returns {module:"discord.js".MessageEmbed}
     */
    embed(title, color) {
        return new Discord.MessageEmbed()
            .setTitle(title + ` [${this.id}]`)
            .setColor(color)
            .addFields(
                /** @type {any} */[
                    {
                        name: 'Trigger',
                        value: `${this.trigger.type}: \`${this.trigger.type === 'regex' ? '/' + this.trigger.content + '/' + this.trigger.flags : this.trigger.content}\``.substring(0, 1000)
                    },
                    {name: 'Response', value: this.response.substring(0, 1000)},
                    {
                        name: 'Channels',
                        value: this.global ? 'global' : this.channels.map(c => `<#${c}>`).join(', ').substring(0, 1000)
                    }
                ]);
    }

    /**
     * create a new response
     * @param {Snowflake} guildID
     * @param {boolean} global
     * @param {Snowflake[]|null} channels
     * @param {String} triggerType
     * @param {String} triggerContent
     * @param {String} responseText
     * @returns {Promise<{success:boolean, response: AutoResponse, message: String}>}
     */
    static async new(guildID, global, channels, triggerType, triggerContent, responseText) {
        let trigger = this.getTrigger(triggerType, triggerContent);
        if (!trigger.success) return trigger;

        const response = new AutoResponse(guildID, {
            trigger: trigger.trigger,
            global,
            channels,
            response: responseText
        });
        await response.save();
        return {success: true, response: response};
    }

    /**
     * edit this auto-response
     * @param {String} option option to change
     * @param {String[]} args
     * @param {module:"discord.js".Guild} guild
     * @returns {Promise<String>} response message
     */
    async edit(option, args, guild) {
        switch (option) {
            case 'trigger': {
                let trigger = this.constructor.getTrigger(args.shift(), args.join(' '));
                if (!trigger.success) return trigger.message;
                this.trigger = trigger.trigger;
                await this.save();
                return 'Successfully changed trigger';
            }

            case 'response': {
                let response = args.join(' ');
                if (!response) response = 'disabled';

                this.response = response;
                await this.save();
                return `Successfully ${response === 'disabled' ? 'disabled' : 'changed'} response`;
            }

            case 'channels': {
                if (args[0].toLowerCase() === 'global') {
                    this.global = true;
                    this.channels = [];
                }
                else {
                    let channels = await util.channelMentions(guild, args);
                    if (!channels) return 'No valid channels specified';
                    this.global = false;
                    this.channels = channels;
                }
                await this.save();
                return global ? 'Successfully made this auto-response global' : 'Successfully changed channels';
            }

            default: {
                return 'Unknown option';
            }
        }
    }
}

module.exports = AutoResponse;
