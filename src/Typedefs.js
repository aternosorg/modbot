const {
    Message,
    Guild,
    Snowflake
} = require('discord.js');

module.exports = {
    /**
     *  Data that resolves to give a Guild object. This can be:
     *  * A Message object
     *  * A Guild object
     *  * A Snowflake
     *  @type {Message|Guild|Snowflake}
     */
    GuildInfo: '',

    /**
     * Punishment types:
     * * ban
     * * kick
     * * mute
     * * softban
     * * strike
     * @property {String} action
     * @property {String|Number} [duration] Punishment duration (only for bans and mutes)
     * @property {String} [message]
     */
    Punishment: {},

    CommandInfo: {
        isCommand: false,
        name: '',
        prefix: '',
        args: ['']
    }
};
