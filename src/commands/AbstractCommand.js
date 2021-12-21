const Database = require('../Database');
const {
    PermissionResolvable,
    Client,
    Message,
    CommandInteractionOptionResolver,
    ApplicationCommandOptionData,
    PermissionFlags,
    MessageEmbed,
    MessageOptions,
    ReplyMessageOptions,
    ButtonInteraction,
    MessageActionRow,
    MessageButton,
    MessageAttachment,
    CommandInteractionOption,
    InteractionReplyOptions,
    InteractionCollector,
} = require('discord.js');
const CommandSource = require('./CommandSource');
const GuildConfig = require('../config/GuildConfig');
const ChannelConfig = require('../config/ChannelConfig');
const UserConfig = require('../config/UserConfig');
const util = require('../util');
const icons = require('../icons');


/**
 * Type of Abstract Command
 * @readonly
 * @enum {String}
 */
const AbstractCommandType = {
    COMMAND: 'COMMAND',
    SUB_COMMAND_GROUP: 'SUB_COMMAND_GROUP',
    SUB_COMMAND: 'SUB_COMMAND'
};


/**
 * @class
 * @classdesc A top-level-command, sub-command-group or sub-command
 */
class AbstractCommand {

    /**
     * Type of Abstract Command
     * @type {AbstractCommandType}
     * @abstract
     */
    static type;

    /**
     * Description of the command
     * @type {string}
     * @abstract
     */
    static description = '';

    /**
     * Parameters/Subcommands
     * @type {string}
     * @abstract
     */
    static usage = '';

    /**
     * The primary command name followed by possible aliases.
     * Only the primary name is used in slash commands and the help command.
     * Secondary names are only shortcuts for message commands.
     * @type {String[]}
     * @abstract
     */
    static names = [];

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
     * If true all responses sent to slash commands will default to be ephemeral unless specified otherwise.
     * @type {boolean}
     */
    static ephemeral = true;

    /**
     * Class of parent command
     * @type {typeof Command}
     */
    static parentCommand = this.getParentCommand();

    /**
     * Source of the top-level-command
     * @type {CommandSource}
     */
    source;

    /**
     * discord client
     * @type {Client}
     */
    bot;

    /**
     * @type {Database}
     */
    database;

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
     * the bot's response to this message
     * sending multiple responses should be avoided
     * @type {Message}
     */
    response;

    /**
     * Command options
     * @type {CommandInteractionOptionResolver}
     */
    options;

    /**
     * @param {CommandSource} source
     * @param {Database} database
     * @param {Client} bot
     * @param {typeof AbstractCommand|null} parentCommand
     */
    constructor(source, database, bot, parentCommand) {
        this.source = source;
        this.database = database;
        this.bot = bot;
        this.constructor.parentCommand = parentCommand;
    }

    /**
     * get slash command options
     * @return {ApplicationCommandOptionData[]}
     */
    static getOptions() {
        return [];
    }

    /**
     * Generate a usage embed
     * @param {CommandSource} source
     * @return {MessageEmbed}
     * @abstract
     */
    // eslint-disable-next-line no-unused-vars
    static async getUsage(source) {

    }

    /**
     * get the primary (first) command name
     * @return {String|null}
     */
    static getPrimaryName() {
        return this.names[0] ?? null;
    }

    /**
     * get the parent command
     * @return {AbstractCommand}
     */
    static getParentCommand() {
        return null;
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
     * @abstract
     */
    async execute() {}

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
     * send a discord embed with a success message
     * @return {Promise<void>}
     */
    async sendSuccess(message) {
        await this.reply({ephemeral: true}, new MessageEmbed({
            color: util.color.green,
            description: message,
        }));
    }

    /**
     * send usage embed
     * @return {Promise<void>}
     */
    async sendUsage() {
        await this.reply({ephemeral: true}, await this.constructor.getUsage(this.source, this.guildConfig));
    }

    /**
     * generate a multi page response
     * @param {(index: Number) => MessageEmbed|Promise<MessageEmbed>} generatePage generate a new page (index)
     * @param {Number} [pages] number of possible pages
     * @param {Number} [duration] inactivity timeout in ms (default: 60s)
     * @param {boolean} ephemeral
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

module.exports = {AbstractCommand, AbstractCommandType};