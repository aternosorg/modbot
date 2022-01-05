const {
    Message,
    CommandInteraction,
    ContextMenuInteraction,
    CommandInteractionOptionResolver,
    Guild,
    TextChannel,
    User,
    GuildMember,
    MessageOptions,
    ReplyMessageOptions,
    InteractionReplyOptions,
    AutocompleteInteraction,
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
     * @type {CommandInteraction|ContextMenuInteraction}
     */
    #interaction;

    /**
     * last response (if this is a message)
     * @type {Message}
     */
    #response;

    /**
     * @param {Message|CommandInteraction|ContextMenuInteraction|AutocompleteInteraction} input
     */
    constructor(input) {
        if (input instanceof Message) {
            this.isInteraction = false;
            this.#message = input;
        }
        else if (input instanceof CommandInteraction || input instanceof ContextMenuInteraction || input instanceof AutocompleteInteraction) {
            this.isInteraction = true;
            this.#interaction = input;
        }
        else {
            throw new TypeError('Unknown command source type!');
        }
    }

    /**
     * get the raw interaction or message
     * @return {Message|CommandInteraction|ContextMenuInteraction}
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
            options.fetchReply = true;

            if (this.#interaction.replied) {
                return this.#interaction.followUp(options);
            }
            else if (this.#interaction.deferred) {
                return this.#interaction.editReply(options);
            }
            else {
                return this.#interaction.reply(options);
            }
        }
        else {
            this.#response = this.#message.reply(options);
            return this.#response;
        }
    }

    editResponse(options) {
        if (this.isInteraction) {
            return this.#interaction.editReply(options);
        }
        else {
            return this.#response.edit(options);
        }
    }

    /**
     * defer the reply to this message
     * @return {Promise}
     */
    defer() {
        if (this.isInteraction) {
            if (this.#interaction.deferred) {
                return null;
            }
            else {
                return this.#interaction.deferReply();
            }
        } else {
            return this.#message.channel.sendTyping();
        }
    }
}

module.exports = CommandSource;
