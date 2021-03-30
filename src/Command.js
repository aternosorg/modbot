const GuildConfig = require('./GuildConfig');
const ChannelConfig = require('./ChannelConfig');
const util = require('./util');
const Discord = require('discord.js');
const defaultPrefix = require('../config.json').prefix;

class Command {
    /**
     * Description of the command
     * @type {string}
     */
    static description = '';

    /**
     * Parameters/Subcommands
     * @type {string}
     */
    static usage = '';

    /**
     * commands
     * @type {String[]}
     */
    static names = [];

    /**
     * Comment
     * @type {String|null}
     */
    static comment = null;

    /**
     * permissions a user needs to execute this command
     * @type {PermissionResolvable[]}
     */
    static userPerms = [];

    /**
     * can moderators execute this command without the required permissions?
     * @type {boolean}
     */
    static modCommand = false;

    /**
     * permissions the bot needs for this command to work
     * @type {PermissionResolvable[]}
     */
    static botPerms = [];

    /**
     * @type {module:"discord.js".Message}
     */
    message;

    /**
     * @type {Database}
     */
    database;

    /**
     * @type {module:"discord.js".Client}
     */
    bot;

    /**
     * arguments passed to the command
     * @type {String[]}
     */
    args;

    /**
     * @type {GuildConfig}
     */
    guildConfig;

    /**
     * @type {ChannelConfig}
     */
    channelConfig;

    /**
     * the name of this command that was used to call it
     * @type {String}
     */
    name;

    /**
     * the prefix used in this command call
     * @type {String}
     */
    prefix;

    /**
     * call this command
     * @param {module:"discord.js".Message} message
     * @param {Database}                    database
     * @param {module:"discord.js".Client}  bot
     * @param {String} name
     * @param {String} prefix
     */
    constructor(message, database, bot, name, prefix) {
        this.message = message;
        this.database = database;
        this.bot = bot;
        this.args = util.split(message.content,' ').slice(1);
        this.name = name;
        this.prefix = prefix;
    }

    async _loadConfigs() {
        this.guildConfig = await GuildConfig.get(/** @type {module:"discord.js".Snowflake} */this.message.guild.id);
        this.channelConfig = await ChannelConfig.get(/** @type {module:"discord.js".Snowflake} */this.message.channel.id);
    }

    /**
     * Can this user run this command?
     * @return {boolean}
     */
    userHasPerms() {
        if (this.constructor.modCommand && this.guildConfig.isMod(this.message.member))
            return true;
        const missingPerms = [];
        for (const perm of this.constructor.userPerms) {
            if (!this.message.member.hasPermission(perm)) missingPerms.push(perm);
        }
        return missingPerms.length ? missingPerms : true;
    }

    /**
     * Can the bot run this command
     * @return {boolean|module:"discord.js".PermissionFlags}
     */
    botHasPerms() {
        const botMember = this.message.guild.member(this.bot.user);
        const missingPerms = [];
        for (const perm of this.constructor.botPerms) {
            if (!botMember.hasPermission(perm)) missingPerms.push(perm);
        }
        return missingPerms.length ? missingPerms : true;
    }

    /**
     * execute the command
     * @return {Promise<void>}
     */
    async execute() {}

    /**
     * Generate a usage embed
     * @param {module:"discord.js".Message} message
     * @param {String}                      cmd
     * @param {GuildConfig}                 [guildConfig]
     * @return {module:"discord.js".MessageEmbed}
     *
     */
    static async getUsage(message, cmd, guildConfig) {
        if (!guildConfig) guildConfig = await GuildConfig.get(message.guild.id);
        const prefix = guildConfig.prefix || defaultPrefix;
        const embed = new Discord.MessageEmbed()
            .setAuthor(`Help for ${cmd} | Prefix: ${prefix}`)
            .setFooter(`Command executed by ${message.author.username}`)
            .addFields(
                /** @type {any} */ { name: "Usage", value: `\`${prefix}${cmd} ${this.usage}\``, inline: true},
                /** @type {any} */ { name: "Description", value: this.description, inline: true},
                /** @type {any} */ { name: "Required Permissions", value: this.userPerms.length !== 0 ? `\`${this.userPerms.join('`, `')}\`` : "none" }
            )
            .setColor(util.color.green)
            .setTimestamp();
        if (this.comment) {
            embed.addFields(
                /** @type {any} */{ name: "Comment", value: `${this.comment}`, inline: false});
        }
        if (this.names.length > 1) {
            let aliases = '';
            for (let name of this.names) {
                if (name !== cmd) {
                    aliases += `\`${name}\`, `;
                }
            }
            embed.addFields(
                /** @type {any} */{ name: "Aliases", value: aliases.substring(0,aliases.length - 2), inline: true});
        }
        return embed;
    }

    /**
     * send usage embed
     * @return {Promise<void>}
     */
    async sendUsage() {
        await this.message.channel.send(await this.constructor.getUsage(this.message,this.name , this.guildConfig));
    }

    /**
     * send a discord embed with an error message
     * @return {Promise<void>}
     */
    async sendError(message) {
        await this.message.channel.send(new Discord.MessageEmbed({
            color: util.color.red,
            description: message,
        }));
    }
}

module.exports = Command
