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
    MessageAttachment,
    ApplicationCommandOptionData,
    CommandInteractionOptionResolver,
    CommandInteractionOption,
    InteractionReplyOptions,
    InteractionCollector,
} = require('discord.js');
const Database = require('./Database');
const defaultPrefix = require('../config.json').prefix;
const icons = require('./icons');
const CommandSource = require('./CommandSource');

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
     * The primary command name followed by possible aliases.
     * Only the primary name is used in slash commands and the help command.
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
     * If true all responses sent to slash commands will default to be ephemeral unless specified otherwise.
     * @type {boolean}
     */
    static ephemeral = true;

    /**
     * @type {Message}
     * @deprecated
     */
    message;

    /**
     * command source
     * @type {CommandSource}
     */
    source;

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
     * @deprecated get options from the {@link options OptionResolver}
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
     * @type {CommandInteractionOptionResolver}
     */
    options;

    /**
     * call this command
     * @param {CommandSource} source
     * @param {Database} database
     * @param {Client} bot
     * @param {String} name
     * @param {String} prefix
     */
    constructor(source, database, bot, name, prefix) {
        this.database = database;
        this.bot = bot;
        this.name = name;
        this.prefix = prefix;
        this.source = source;

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
     * get slash command definition
     * @return {ApplicationCommandOptionData[]}
     */
    static getOptions() {
        return [];
    }

    async _loadConfigs() {
        this.guildConfig = await GuildConfig.get(this.source.getGuild().id);
        this.channelConfig = await ChannelConfig.get(this.source.getChannel().id);
        this.userConfig = await UserConfig.get(this.source.getUser().id);
    }

    /**
     * Can this user run this command?
     * @return {boolean|PermissionFlags[]}
     */
    userHasPerms() {
        if (this.constructor.modCommand && this.guildConfig.isMod(this.source.getMember()))
            return true;
        const missingPerms = [];
        for (const perm of this.constructor.userPerms) {
            if (!this.source.getMember().permissions.has(perm)) missingPerms.push(perm);
        }
        return missingPerms.length ? missingPerms : true;
    }

    /**
     * Can the bot run this command
     * @return {boolean|PermissionFlags[]}
     */
    botHasPerms() {
        const botMember = this.source.getGuild().members.resolve(this.bot.user);
        const missingPerms = [];
        for (const perm of this.constructor.botPerms) {
            if (!botMember.permissions.has(perm)) missingPerms.push(perm);
        }
        return missingPerms.length ? missingPerms : true;
    }

    /**
     * parse options from a message
     * @param {String[]} args arguments
     * @return {CommandInteractionOption[]}
     */
    // eslint-disable-next-line no-unused-vars
    parseOptions(args) {
        return [];
    }

    /**
     * execute the command
     * @return {Promise<void>}
     */
    async execute() {}

    /**
     * Generate a usage embed
     * @param {CommandSource} source
     * @param {String}                      cmd
     * @param {GuildConfig}                 [guildConfig]
     * @return {MessageEmbed}
     */
    static async getUsage(source, cmd, guildConfig) {
        if (!guildConfig) guildConfig = await GuildConfig.get(source.getGuild().id);
        const prefix = guildConfig.prefix || defaultPrefix;
        const embed = new MessageEmbed()
            .setAuthor(`Help for ${cmd} | Prefix: ${prefix}`)
            .setFooter(`Command executed by ${util.escapeFormatting(source.getUser().tag)}`)
            .addFields(
                /** @type {any} */ { name: 'Usage', value: `\`${prefix}${cmd}${this.usage ? ` ${this.usage}` : ''}\``, inline: true},
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
        await this.reply({ephemeral: true}, await this.constructor.getUsage(this.source, this.name, this.guildConfig));
    }

    /**
     * send a discord embed with an error message
     * @return {Promise<void>}
     */
    async sendError(message) {
        await this.reply({ephemeral: true}, new MessageEmbed({
            color: util.color.red,
            description: message,
        }));
    }

    /**
     *
     * @param {String|MessageOptions|ReplyMessageOptions|InteractionReplyOptions|MessageEmbed|MessageAttachment} message
     * @param {MessageEmbed|MessageAttachment} additions
     * @return {Promise<void>}
     */
    async reply(message, ...additions) {
        /** @type {MessageOptions|ReplyMessageOptions|InteractionReplyOptions}*/
        let options = {};

        if (typeof message === 'string') {
            options.content = message;
        }
        else if (message instanceof MessageEmbed || message instanceof MessageAttachment) {
            additions.unshift(message);
        }
        else if (message instanceof Object) {
            options = message;
        }

        options.embeds ??= [];
        options.embeds = options.embeds.concat(additions.filter(a => a instanceof MessageEmbed));
        options.files ??= [];
        options.files = options.files.concat(additions.filter(a => a instanceof MessageAttachment));
        if (this.constructor.ephemeral) {
            options.ephemeral ??= true;
        }

        if (!this.source.isInteraction) {
            options.ephemeral = undefined;
            if (this.source.getGuild() && this.userConfig.deleteCommands) {
                this.response = await this.source.getChannel().send(options);
                return;
            } else {
                options.failIfNotExists ??= false;
                options.allowedMentions ??= {repliedUser: false};
            }
        }
        this.response = await this.source.reply(options);
    }

    /**
     * generate a multi page response
     * @param {(index: Number) => MessageEmbed|Promise<MessageEmbed>} generatePage generate a new page (index)
     * @param {Number} [pages] number of possible pages
     * @param {Number} [duration] inactivity timeout in ms (default: 60s)
     */
    async multiPageResponse(generatePage, pages, duration = 60000, ephemeral) {
        const previousButton = new MessageButton({
                customId: 'previous',
                style: 'SECONDARY',
                emoji: icons.left,
                disabled: true,
            }),
            nextButton = new MessageButton({
                customId: 'next',
                style: 'SECONDARY',
                emoji: icons.right,
                disabled: pages === 1
            });
        await this.reply({
            ephemeral,
            components: [new MessageActionRow({
                components: [previousButton, nextButton]
            })]
        }, await generatePage(0));
        const message = this.response;

        /**
         * @type {Message}
         */
        let updating;
        /**
         * @type {InteractionCollector<ButtonInteraction>}
         */
        const components = message.createMessageComponentCollector( {
            /**
             * @param {ButtonInteraction} interaction
             * @return {Promise<boolean>}
             */
            filter: async (interaction) => {
                if (interaction.user.id === this.source.getUser().id) {
                    updating = await interaction.reply({fetchReply: true, content: 'Updating embed...'});
                    return true;
                }
                else {
                    await interaction.reply({ephemeral: true, content: 'Only the message author can do that!'});
                    return false;
                }
            }
        });

        let index = 0,
            timeout = setTimeout(end, duration);

        components.on('collect', /** @param {ButtonInteraction} interaction */async (interaction) => {
            if (interaction.customId === 'next') {
                index++;
            }
            if (interaction.customId === 'previous') {
                index--;
            }

            await message.edit({
                embeds: [await generatePage(index)],
                components: [new MessageActionRow({
                    components: [
                        previousButton.setDisabled(index === 0),
                        nextButton.setDisabled(index === pages -1)
                    ]
                })]
            });
            await updating.delete();
            clearTimeout(timeout);
            setTimeout(end, duration);
        });

        async function end() {
            components.stop('TIME');
            await message.edit({
                components: [
                    previousButton.setDisabled(true),
                    nextButton.setDisabled(true)
                ]});
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
        await this.reply({ephemeral: false, content: text, components: [buttons]});
        try {
            const component = await this.response.awaitMessageComponent({
                max: 1, time: options.time, errors: ['time'],
                filter: async (interaction) => {
                    if (interaction.user.id !== this.source.getUser().id) {
                        await interaction.reply({
                            ephemeral: true,
                            content: 'Only the message author can do this.'
                        });
                        return false;
                    }
                    return true;
                }
            });
            for (const button of buttons.components) {
                button.setDisabled(true);
            }
            await this.response.edit({components: [buttons]});
            return {component, confirmed: component.customId === 'confirm'};
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
