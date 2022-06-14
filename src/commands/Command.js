const {AbstractCommand, AbstractCommandType} = require('./AbstractCommand');
const util = require('../util');
const {
    Message,
    Client,
    MessageEmbed,
    CommandInteractionOptionResolver,
} = require('discord.js');
const defaultPrefix = require('../../config.json').prefix;
const Database = require('../Database');
const CommandSource = require('./CommandSource');
const GuildConfig = require('../config/GuildConfig');

/**
 * @class
 * @classdesc A top-level-command
 * @abstract
 */
class Command extends AbstractCommand {

    static type = AbstractCommandType.COMMAND;

    /**
     * Comment
     * @type {String|null}
     */
    static comment = null;

    /**
     * does this command support slash commands
     * @type {boolean}
     */
    static supportsSlashCommands = false;

    /**
     * supported context menus
     * @type {{MESSAGE: boolean, USER: boolean}}
     */
    static supportedContextMenus = {
        USER: false,
        MESSAGE: false,
    };

    /**
     * can this command only be used in guilds
     * to allow commands in dms enable this. Note that the following things don't exist in DMs:
     * * Permission checks
     * * User configs
     * * Channel configs
     * * Guild configs (duh!)
     * * The channel object (will be partial!)
     * @type {boolean}
     */
    static guildOnly = true;

    /**
     * can this command only be used in whitelisted guilds (config->featureWhitelist)
     * @type {boolean}
     */
    static private = false;

    /**
     * @type {Message}
     * @deprecated use {@link source source}
     */
    message;

    /**
     * arguments passed to the command
     * @deprecated get options from the {@link options OptionResolver}
     * @type {String[]}
     */
    args;

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
     * @param {CommandSource} source
     * @param {Database} database
     * @param {Client} bot
     * @param {String} name
     * @param {String} prefix
     */
    constructor(source, database, bot, name, prefix) {
        super(source, database, bot, null);
        this.name = name;
        this.prefix = prefix;

        if (source.isInteraction) {
            this.options = source.getOptions();
        }
        else {
            this.message = source.getRaw();
            const args = util.split(source.getRaw().content.substring(prefix.length + name.length), ' ');
            this.args = args;
            this.options = new CommandInteractionOptionResolver(bot, this.parseOptions(args));
        }
    }

    /**
     * Generate a usage embed
     * @param {CommandSource} source
     * @return {MessageEmbed}
     */
    static async getUsage(source) {
        const guildConfig = await GuildConfig.get(source.getGuild().id);
        const prefix = source.isInteraction ? '/' : guildConfig.prefix || defaultPrefix;
        const embed = new MessageEmbed()
            .setAuthor({name: `Help for ${this.getPrimaryName()} | Prefix: ${prefix}`})
            .setFooter({text: `Command executed by ${util.escapeFormatting(source.getUser().tag)}`})
            .addFields(
                /** @type {any} */ { name: 'Usage', value: `\`${prefix}${this.getPrimaryName()} ${this.usage ?? ''}`.trim() + '`', inline: true},
                /** @type {any} */ { name: 'Description', value: this.description, inline: true},
                /** @type {any} */ { name: 'Required Permissions', value: this.userPerms.map(p => '`'+p+'`').join(', ') || 'none', inline: true }
            )
            .setColor(util.color.red)
            .setTimestamp();
        if (this.comment) {
            embed.addFields(
                /** @type {any} */{ name: 'Comment', value: `${this.comment}`, inline: false});
        }
        let aliases = this.names.slice(1).map(name => `\`${name}\``).join(', ');
        if(aliases) {
            embed.addFields(
                /** @type {any} */{name: 'Aliases', value: aliases, inline: true});
        }
        return embed;
    }

    /**
     * get an overview of this command
     * @return {string}
     */
    static getOverview() {
        return `**${this.names.join(', ')}**\n`+
            `${this.description}\n`;
    }
}

module.exports = Command;
