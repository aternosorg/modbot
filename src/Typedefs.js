/**
 *
 * @typedef {Object} ModerationData
 * @property {Number} id
 * @property {module:"discord.js".Snowflake} guildid
 * @property {module:"discord.js".Snowflake} userid
 * @property {String} action
 * @property {Number} created
 * @property {Number} value
 * @property {Number|null} expireTime
 * @property {String} reason
 * @property {module:"discord.js".Snowflake} moderator
 * @property {boolean} active
 */

/**
 * Data imported from Vortex
 * @typedef {Object} VortexData
 * @property {Object} tempmutes
 * @property {Object} strikes
 * @property {Object} tempbans
 */

/**
 * A trigger for an AutoResponse this can be:
 * * a string that has to be included
 * * a string that has to match the message
 * * a regex
 * @typedef {Object} Trigger
 * @property {String} type the type of the trigger possible types:
 * * regex
 * * include
 * * match
 * @property {String} content the string or regex
 * @property {String} [flags] flags for regex's
 */

/**
 * Data that resolves to give a Guild object. This can be:
 * * A Message object
 * * A Guild object
 * * A Snowflake
 * @typedef {module:"discord.js".Message|module:"discord.js".Guild|module:"discord.js".Snowflake|Snowflake} GuildInfo
 */

/**
 * @typedef {Object} Punishment
 * @property {String} action possible values:
 * * ban
 * * kick
 * * mute
 * * softban
 * * strike
 * @property {String|Number} [duration]
 * @property {String} [message]
 */

/**
 * @typedef {module:"discord.js".Snowflake} Snowflake
 */
