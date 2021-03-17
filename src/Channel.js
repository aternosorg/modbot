const icons = require('./icons');
const Discord = require('discord.js');

class Channel {
    /**
     * @type {TextChannel | DMChannel | NewsChannel}
     */
    channel;

    /**
     *
     * @param {TextChannel | DMChannel | NewsChannel} channel
     */
    constructor(channel) {
        this.channel = channel;
    }

    /**
     *
     * @param {module:"discord.js".User} user
     * @param {String} text
     * @param {Object} [options]
     * @param {Number} [options.time]
     * @return {Promise<boolean>}
     */
    async getConfirmation(user, text, options = {time: 15000}) {
        /** @type {module:"discord.js".Message} */
        const response = await this.channel.send(text);
        await response.react(icons.yes);
        await response.react(icons.no);
        try {
            /**
             * @type {Collection<Snowflake, MessageReaction>}
             */
            const reactions = await response.awaitReactions((reaction, reactingUser) => {
                return reactingUser.id === user.id && (reaction.emoji.name === icons.yes || reaction.emoji.name === icons.no);
            }, { max: 1, time: options.time, errors: ['time'] });
            return reactions.first().emoji.name === icons.yes;
        }
        catch (e) {
            if (e instanceof Discord.Collection)
                return false;
            else
                throw e;
        }
    }

}

module.exports = Channel;
