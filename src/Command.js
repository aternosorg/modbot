const GuildConfig = require('./config/GuildConfig');
const ChannelConfig = require('./config/ChannelConfig');
const UserConfig = require('./config/UserConfig');
const util = require('./util');
const {
    PermissionResolvable,
    Message,
    Client,
    PermissionFlags,
    MessageEmbed,
    MessageOptions,
    ReplyMessageOptions,
    ButtonInteraction,
    MessageActionRow,
    MessageButton,
} = require('discord.js');
const Database = require('./Database');
const defaultPrefix = require('../config.json').prefix;
const icons = require('./icons');

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
     * @type {Message}
     */
    message;

    /**
     * @type {Database}
     */
    database;

    /**
     * @type {Client}
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
     * @type {UserConfig}
     */
    userConfig;

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
     * the bot's response to this message
     * sending multiple responses should be avoided
     * @type {Message}
     */
    response;

    /**
     * call this command
     * @param {Message} message
     * @param {Database}                    database
     * @param {Client}  bot
     * @param {String} name
     * @param {String} prefix
     */
    constructor(message, database, bot, name, prefix) {
        this.message = message;
        this.database = database;
        this.bot = bot;
        this.args = util.split(message.content.substring(prefix.length + name.length),' ');
        this.name = name;
        this.prefix = prefix;
    }

    async _loadConfigs() {
        this.guildConfig = await GuildConfig.get(this.message.guild.id);
        this.channelConfig = await ChannelConfig.get(this.message.channel.id);
        this.userConfig = await UserConfig.get(this.message.author.id);
    }

    /**
     * Can this user run this command?
     * @return {boolean|String[]}
     */
    userHasPerms() {
        if (this.constructor.modCommand && this.guildConfig.isMod(this.message.member))
            return true;
        const missingPerms = [];
        for (const perm of this.constructor.userPerms) {
            if (!this.message.member.permissions.has(perm)) missingPerms.push(perm);
        }
        return missingPerms.length ? missingPerms : true;
    }

    /**
     * Can the bot run this command
     * @return {boolean|PermissionFlags}
     */
    botHasPerms() {
        const botMember = this.message.guild.members.resolve(this.bot.user);
        const missingPerms = [];
        for (const perm of this.constructor.botPerms) {
            if (!botMember.permissions.has(perm)) missingPerms.push(perm);
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
     * @param {Message} message
     * @param {String}                      cmd
     * @param {GuildConfig}                 [guildConfig]
     * @return {MessageEmbed}
     */
    static async getUsage(message, cmd, guildConfig) {
        if (!guildConfig) guildConfig = await GuildConfig.get(message.guild.id);
        const prefix = guildConfig.prefix || defaultPrefix;
        const embed = new MessageEmbed()
            .setAuthor(`Help for ${cmd} | Prefix: ${prefix}`)
            .setFooter(`Command executed by ${util.escapeFormatting(message.author.tag)}`)
            .addFields(
                /** @type {any} */ { name: 'Usage', value: `\`${prefix}${cmd} ${this.usage}\``, inline: true},
                /** @type {any} */ { name: 'Description', value: this.description, inline: true},
                /** @type {any} */ { name: 'Required Permissions', value: this.userPerms.length !== 0 ? `\`${this.userPerms.join('`, `')}\`` : 'none', inline: true }
            )
            .setColor(util.color.red)
            .setTimestamp();
        if (this.comment) {
            embed.addFields(
                /** @type {any} */{ name: 'Comment', value: `${this.comment}`, inline: false});
        }
        if (this.names.length > 1) {
            let aliases = '';
            for (let name of this.names) {
                if (name !== cmd) {
                    aliases += `\`${name}\`, `;
                }
            }
            embed.addFields(
                /** @type {any} */{ name: 'Aliases', value: aliases.substring(0,aliases.length - 2), inline: true});
        }
        return embed;
    }

    /**
     * send usage embed
     * @return {Promise<void>}
     */
    async sendUsage() {
        await this.reply(await this.constructor.getUsage(this.message,this.name , this.guildConfig));
    }

    /**
     * send a discord embed with an error message
     * @return {Promise<void>}
     */
    async sendError(message) {
        await this.reply(new MessageEmbed({
            color: util.color.red,
            description: message,
        }));
    }

    /**
     *
     * @param {String|MessageEmbed} message
     * @param {MessageEmbed} additions
     * @return {Promise<void>}
     */
    async reply(message, ...additions) {
        /** @type {MessageOptions|ReplyMessageOptions}*/
        const options = {
            embeds: additions
        };
        if (typeof message === 'string') {
            options.content = message;
        }
        else {
            options.embeds.unshift(message);
        }

        if (this.userConfig.deleteCommands) {
            this.response = await this.message.channel.send(options);
        }
        else {
            options.failIfNotExists = false;
            options.allowedMentions = {repliedUser: false};
            this.response = await this.message.reply(options);
        }
    }

    /**
     * generate a multi page response
     * @param {function} generatePage generate a new page (index)
     * @param {Number} [pages] number of possible pages
     * @param {Number} [duration] inactivity timeout in ms (default: 60s)
     */
    async multiPageResponse(generatePage, pages, duration = 60000) {
        /** @type {Message} */
        const message = await this.reply(await generatePage(0));

        if (pages === 1) return;
        await message.react(icons.right);

        const reactions = message.createReactionCollector( async (reaction, user) => {
            if (user.id === this.message.author.id && [icons.left,icons.right].includes(reaction.emoji.name)) {
                return true;
            }
            else {
                if (user.id !== this.bot.user.id) await reaction.users.remove(user);
                return false;
            }
        });

        let index = 0,
            timeout = setTimeout(end, duration);

        reactions.on('collect', async (reaction) => {
            if (reaction.emoji.name === icons.right && index !== pages - 1) {
                index++;
            }
            if (reaction.emoji.name === icons.left && index !== 0) {
                index--;
            }
            await message.edit(await generatePage(index));
            await message.reactions.removeAll();
            if (index !== pages -1) await message.react(icons.right);
            if (index !== 0) await message.react(icons.left);
            clearTimeout(timeout);
            setTimeout(end, duration);
        });

        async function end() {
            reactions.stop('TIME');
            await message.reactions.removeAll();
        }
    }

    /**
     * get an overview of this command
     * @return {string}
     */
    static getOverview() {
        return `**${this.names.join(', ')}**\n`+
            `${this.description}\n`;
    }

    /**
     * @param {String} text
     * @param {Object} [options]
     * @param {Number} [options.time]
     * @return {Promise<{interaction: ButtonInteraction, confirmed: boolean}>}
     */
    async getConfirmation(text, options = {time: 15000}) {
        const buttons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('confirm')
                    .setLabel('Confirm')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setCustomId('cancel')
                    .setLabel('Cancel')
                    .setStyle('SUCCESS')
            );
        /** @type {Message} */
        this.response = await this.message.channel.send({content: text, components: [buttons]});
        try {
            const component = await this.response.awaitMessageComponent({
                max: 1, time: options.time, errors: ['time']
            });
            for (const button of buttons.components) {
                button.setDisabled(true);
            }
            await this.response.edit({components: [buttons]});
            return {component, confirmed: component.customId === 'confirmed'};
        }
        catch (e) {
            for (const button of buttons.components) {
                button.setDisabled(true);
            }
            await this.response.edit({components: [buttons]});
            if (e.code === 'INTERACTION_COLLECTOR_ERROR')
                return {component: null, confirmed: false};
            else
                throw e;
        }
    }
}

module.exports = Command;
