const {AbstractCommand, AbstractCommandType} = require('./AbstractCommand');
const CommandSource = require('./CommandSource');
const Database = require('../bot/Database.js');
const {
    Client, MessageEmbed
} = require('discord.js');
const GuildConfig = require('../config/GuildConfig');
const {prefix: defaultPrefix} = require('../../config.json');
const util = require('../util');
/**
 * @class
 * @classdesc sub-command
 * @abstract
 */
class SubCommand extends AbstractCommand {

    static type = AbstractCommandType.SUB_COMMAND;

    /**
     * call this sub command
     * @param {CommandSource} source
     * @param {Database} database
     * @param {Client} bot
     * @param {AbstractCommand} parent
     */
    constructor(source, database, bot, parent) {
        super(source, database, bot, parent);
    }

    static async getUsage(source) {
        const guildConfig = await GuildConfig.get(source.getGuild().id);
        const prefix = source.isInteraction ? '/' : guildConfig.prefix || defaultPrefix;
        const embed = new MessageEmbed()
            .setAuthor({name: `Help for ${this.parentCommand.getPrimaryName()} ${this.getPrimaryName()} | Prefix: ${prefix}`})
            .setFooter({text: `Command executed by ${util.escapeFormatting(source.getUser().tag)}`})
            .addFields(
                /** @type {any} */ { name: 'Usage', value: `\`${prefix}${this.parentCommand.getPrimaryName()} `+
                        `${this.getPrimaryName()} ${this.usage ?? ''}`.trim() + '`', inline: true},
                /** @type {any} */ { name: 'Description', value: this.description, inline: true},
                /** @type {any} */ { name: 'Required Permissions', value: this.parentCommand.userPerms.concat(this.userPerms).map(p => '`'+p+'`').join(', ') || 'none', inline: true }
            )
            .setColor(util.color.red)
            .setTimestamp();
        if (this.parentCommand.comment) {
            embed.addFields(
                /** @type {any} */{ name: 'Comment', value: `${this.parentCommand.comment}`, inline: false});
        }
        let aliases = this.names.slice(1).map(name => `\`${name}\``).join(', ');
        if(aliases) {
            embed.addFields(
                /** @type {any} */{name: 'Aliases', value: aliases, inline: true});
        }
        return embed;
    }

    userHasPerms() {
        if (this.constructor.userPerms === []) {
            this.constructor.userPerms = this.constructor.parentCommand.userPerms;
        }
        return super.userHasPerms();
    }
}

module.exports = SubCommand;
