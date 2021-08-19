const {
    Message,
    CommandInteraction,
    CommandInteractionOptionResolver,
    Guild,
    TextChannel,
    User,
    GuildMember,
    MessageOptions,
    ReplyMessageOptions,
    InteractionReplyOptions,
} = require('discord.js');

class CommandSource {

    /**
     * is this a slash command
     * @type {boolean}
     */
    isInteraction;

    /**
     * message (if exists)
     * @type {Message}
     */
    #message;

    /**
     * interaction (if exists)
     * @type {CommandInteraction}
     */
    #interaction;

    /**
     * @param {Message|CommandInteraction} input
     */
    constructor(input) {
        if (input instanceof Message) {
            this.isInteraction = false;
            this.#message = input;
        }
        else if (input instanceof CommandInteraction) {
            this.isInteraction = true;
            this.#interaction = input;
        }
        else {
            throw new TypeError('Unknown command source type!');
        }
    }

    /**
     * get the raw interaction or message
     * @return {Message|CommandInteraction}
     */
    getRaw() {
        return this.isInteraction ? this.#interaction : this.#message;
    }

    /**
     * get option resolver (only for interactions)
     * @return {CommandInteractionOptionResolver|null}
     */
    getOptions() {
        return this.isInteraction ? this.#interaction.options : null;
    }

    /**
     * @return {Guild}
     */
    getGuild() {
        return this.getRaw().guild;
    }

    /**
     * @return {TextChannel}
     */
    getChannel() {
        return this.getRaw().channel;
    }

    /**
     * @return {User}
     */
    getUser() {
        return this.isInteraction ? this.#interaction.user : this.#message.author;
    }

    /**
     * @return {GuildMember}
     */
    getMember() {
        return this.getRaw().member;
    }

    /**
     * @param {MessageOptions|ReplyMessageOptions|InteractionReplyOptions} options
     * @return {Promise<Message>}
     */
    reply(options) {
        if (this.isInteraction) {
            if (!options.ephemeral)
                options.fetchReply = true;
            if (this.#interaction.replied)
                return this.#interaction.followUp(options);
            else
                return this.#interaction.reply(options);
        }
        else {
            return this.#message.reply(options);
        }
    }
}

module.exports = CommandSource;
