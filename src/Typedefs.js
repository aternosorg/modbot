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
     * Punishment
     */
    Punishment: {
        /**
         * punishment action - possible values:
         * * ban
         * * kick
         * * mute
         * * softban
         * * strike
         * @type {String}
         */
        action: '',

        /**
         * Punishment duration (only for ban and mute)
         * @type {String|Number|undefined}
         */
        duration: undefined,

        /**
         * @property {String|undefined}
         */
        message: undefined,
    },

    CommandInfo: {
        isCommand: false,
        name: '',
        prefix: '',
        args: ['']
    }
};
