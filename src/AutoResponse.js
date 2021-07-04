const ChatTriggeredFeature = require('./ChatTriggeredFeature');
const Discord = require('discord.js');

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

}

module.exports = AutoResponse;
