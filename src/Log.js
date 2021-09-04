const util = require('./util');
const {
    Constants,
    MessageEmbed,
    Message,
    Guild,
    ClientUser,
    User,
    GuildChannel,
} = require('discord.js');
const GuildConfig = require('./config/GuildConfig');
const {APIErrors} = Constants;
const {GuildInfo} = require('./Typedefs');

class Log{
    /**
     * Logs a message to the guilds log channel (if specified)
     * @param {GuildInfo} guildInfo
     * @param {String} message content of the log message
     * @param {MessageEmbed} [options]
     * @return {Promise<Message|null>} log message
     */
    static async log(guildInfo, message, options) {
        /** @type {Guild} */
        const guild = await util.resolveGuild(guildInfo);

        /** @type {GuildConfig} */
        const guildConfig = await GuildConfig.get(guild.id);
        if (!guildConfig.logChannel) return null;

        return this._send(guild.channels.resolve(guildConfig.logChannel), message, options);
    }

    /**
     * Logs an embed to the guilds log channel (if specified)
     * @async
     * @param {GuildInfo}                               guildInfo guild
     * @param {MessageEmbed|Object} embed     embed to log
     * @return {Promise<Message|null>} log message
     */
    static logEmbed(guildInfo, embed) {
        return this.log(guildInfo,'',new MessageEmbed(embed));
    }

    /**
     * Logs the deletion of a message to the guilds log channel (if specified)
     * @async
     * @param message deleted message
     * @param reason  reason for the deletion
     * @return {Promise<Message|null>} log message
     */
    static async logMessageDeletion(message, reason) {
        if (message.content.length === 0) return;
        return this.log(message, `Message in <#${message.channel.id}> deleted`, new MessageEmbed({
            footer: {
                text: message.author.id,
                iconURL: message.author.avatarURL()
            },
            author: {
                name: `${util.escapeFormatting(message.author.tag)}`,
                icon_url: message.author.avatarURL()
            },
            color: util.color.orange,
            fields: [{
                name: 'Message',
                value: message.content.substring(0, 1024)
            },
            {
                name: 'Reason',
                value: reason.substring(0, 512)
            }]
        }));
    }

    /**
     * Logs a message to the guilds message log channel (if specified)
     * @param {GuildInfo}                        guildInfo
     * @param {String}                           message   content of the log message
     * @param {MessageEmbed} [options]
     * @return {Promise<Message|null>} log message
     */
    static async messageLog(guildInfo, message, options) {
        /** @type {Guild} */
        const guild = await util.resolveGuild(guildInfo);

        /** @type {GuildConfig} */
        const guildConfig = await GuildConfig.get(guild.id);
        if (!guildConfig.messageLogChannel) return null;

        return this._send(guild.channels.resolve(guildConfig.messageLogChannel), message, options);
    }

    /**
     * Logs an embed to the guilds message log channel (if specified)
     * @param {GuildInfo}                               guildInfo
     * @param {MessageEmbed|Object} embed     embed to log
     * @return {Promise<Message|null>} log message
     */
    static async messageLogEmbed(guildInfo, embed) {
        return this.messageLog(guildInfo,'',new MessageEmbed(embed));
    }

    /**
     * Logs a message to the guilds join log channel (if specified)
     * @param {GuildInfo}                        guildInfo
     * @param {String}                           message   content of the log message
     * @param {MessageEmbed} [options]
     * @return {Promise<Message|null>} log message
     */
    static async joinLog(guildInfo, message, options) {
        /** @type {Guild} */
        const guild = await util.resolveGuild(guildInfo);

        /** @type {GuildConfig} */
        const guildConfig = await GuildConfig.get(guild.id);
        if (!guildConfig.joinLogChannel) return null;

        return this._send(guild.channels.resolve(/** @type {String} */guildConfig.joinLogChannel), message, options);
    }

    /**
     * Log a moderation
     * @async
     * @param {GuildInfo} guildInfo
     * @param {User|ClientUser} moderator user that started the moderation
     * @param {User} user user that was moderated
     * @param {String} reason reason for the moderation
     * @param {Number} insertId id in the moderations table of the db
     * @param {String} type moderation action
     * @param {Object} [options] optional information
     * @param {String} [options.time] duration of the moderation as a time string
     * @param {Number} [options.amount] amount of strikes that were given/pardoned
     * @param {Number} [options.total] total strike count
     * @return {Promise<Message|null>}
     */
    static async logModeration (guildInfo, moderator, user, reason, insertId, type, options = {}) {
        const embedColor = util.color.resolve(type);
        const logEmbed = new MessageEmbed()
            .setColor(embedColor)
            .setAuthor(`Case ${insertId} | ${util.toTitleCase(type)} | ${user.tag}`, user.avatarURL())
            .setFooter(`ID: ${user.id}`)
            .setTimestamp()
            .addFields(
                /** @type {any} */ { name: 'User', value: `<@${user.id}>`, inline: true},
                /** @type {any} */ { name: 'Moderator', value: `<@${moderator.id}>`, inline: true},
                /** @type {any} */ { name: 'Reason', value: reason.substring(0, 1024), inline: true}
            );
        if (options.time) {
            logEmbed.addField('Duration', options.time, true);
        }
        if (options.amount) {
            logEmbed.addField('Amount', '' + options.amount, true);
            logEmbed.addField('Total Strikes', '' + options.total, true);
        }
        return this.logEmbed(guildInfo, logEmbed);
    }

    /**
     * Log automatic unbans etc.
     * @async
     * @param {GuildInfo} guildInfo
     * @param {User} user user that was moderated
     * @param {String} reason reason for the moderation
     * @param {Number} insertId id in the moderations table of the db
     * @param {String} type moderation action
     * @return {Message}
     */
    static async logCheck(guildInfo, user, reason, insertId, type) {
        const logEmbed = new MessageEmbed()
            .setColor(util.color.green)
            .setAuthor(`Case ${insertId} | ${type} | ${user.tag}`, user.avatarURL())
            .setFooter(`ID: ${user.id}`)
            .setTimestamp()
            .addFields(
                /** @type {any}*/ { name: 'User', value: `<@!${user.id}>`, inline: true},
                /** @type {any}*/ { name: 'Reason', value: reason.substring(0, 512), inline: true}
            );

        return this.logEmbed(guildInfo,logEmbed);
    }

    /**
     * try to send this message to this channel
     * @param {GuildChannel} channel
     * @param {String} message
     * @param {MessageEmbed} [embeds]
     * @returns {Promise<null|*>}
     * @private
     */
    static async _send(channel, message, ...embeds) {
        if (!channel) return null;
        try {
            return channel.send({
                content: message || undefined,
                embeds: embeds
            });
        }
        catch (e) {
            if ([APIErrors.MISSING_ACCESS, APIErrors.MISSING_PERMISSIONS].includes(e.code)) {
                return null;
            }
            else {
                throw e;
            }
        }
    }
}

module.exports = Log;
