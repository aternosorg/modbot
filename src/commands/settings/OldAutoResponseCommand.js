const Command = require('../Command');
const {
    Collection,
    Snowflake,
    Message,
    MessageEmbed,
} = require('discord.js');
const util = require('../../util');
const AutoResponse = require('../../AutoResponse');
const ChatTriggeredFeature = require('../../ChatTriggeredFeature');

class AutoResponseCommand extends Command {

    static description = 'Configure auto-responses';

    static usage = 'list|add|remove|show|edit';

    static subCommands = {
        list: {
            usage:'',
            description: 'List all auto-responses'
        },
        add: {
            usage: 'global|<channels> regex|include|match <trigger>',
            description: 'Add an auto-response'
        },
        remove: {
            usage: '<id>',
            description: 'Remove an auto-response'
        },
        show: {
            usage: '<id>',
            description: 'Display an auto-response'
        },
        edit: {
            usage: '<id> trigger|response|channels <value>',
            description: 'change options of an auto-response'
        }
    }
    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length === 0) {
            await this.sendUsage();
            return;
        }

        /** @type {Collection<Number,ChatTriggeredFeature>} */
        const responses = await AutoResponse.getAll(/** @type {Snowflake} */ this.message.guild.id);

        switch (this.args.shift().toLowerCase()) {
            case 'list': {
                if (!responses.size) return this.reply('No auto-responses!');

                let text = '';
                for (const [id, response] of responses) {
                    const info = `[${id}] ${response.global ? 'global' : response.channels.map(c => `<#${c}>`).join(', ')} ` +
                        '`' + response.trigger.asString() + '`\n';

                    if (text.length + info.length < 2000) {
                        text += info;
                    } else {
                        await this.reply(text);
                        text = info;
                    }
                }
                if (text.length) await this.reply(text);
                break;
            }

            case 'add': {
                if (this.args.length < 2) return this.sendSubCommandUsage('add');

                const global = this.args[0].toLowerCase() === 'global';

                let channels;
                if (!global) channels = await util.channelMentions(this.message.guild, this.args);
                else this.args.shift();

                if (!global && !channels.length) return this.sendUsage();

                const type = this.args.shift().toLowerCase();
                const content = this.args.join(' ');

                await this.reply('Please enter your response:');
                const responseText = await util.getResponse(this.message.channel, this.message.author.id);
                if (!responseText) return;

                let response = await AutoResponse.new(this.message.guild.id, global, channels, type, content, responseText);
                if (!response.success) return this.reply(response.message);

                await this.reply(response.response.embed('Added new auto-response', util.color.green));
                break;
            }

            case 'remove': {
                const response = await this.getAutoResponse(this.args.shift(), 'remove');
                if (!response) return;
                await response.remove();
                await this.reply(response.embed(`Removed auto-response ${response.id}`, util.color.red));
                break;
            }

            case 'show': {
                const response = await this.getAutoResponse(this.args.shift(), 'show');
                if (!response) return;
                await this.reply(response.embed(`Auto-response ${response.id}`, util.color.green));
                break;
            }

            case 'edit': {
                if (this.args.length < 3) return this.sendSubCommandUsage('edit');
                const response = await this.getAutoResponse(this.args.shift(), 'edit');
                if (!response) return;

                const edit = await response.edit(this.args.shift(), this.args, this.message.guild);

                if (!edit.success) {
                    return this.sendError(edit.message);
                }

                await this.reply(response.embed(edit.message, util.color.green));
                break;
            }

            default:
                await this.sendUsage();
        }

    }

    /**
     * get a single auto-response
     * @param {String|Number} id
     * @param {String} subCommand
     * @returns {Promise<AutoResponse|null>}
     */
    async getAutoResponse(id, subCommand) {
        if (!id || !parseInt(id)) {
            await this.sendSubCommandUsage(subCommand);
            return null;
        }
        const result = await AutoResponse.getByID(id);
        if (!result) {
            await this.sendSubCommandUsage(subCommand);
            return null;
        }
        return result;
    }

    /**
     * send usage for a subcommand
     * @param {String} commandName sub command name
     * @returns {Promise<Message>}
     */
    async sendSubCommandUsage(commandName) {
        commandName = commandName.toLowerCase();
        let subCommand = this.constructor.subCommands[commandName];
        if (!subCommand) throw 'Unknown subcommand';

        return this.reply(new MessageEmbed()
            .setAuthor(`Help for ${this.name} ${commandName} | Prefix: ${this.prefix}`)
            .setFooter(`Command executed by ${util.escapeFormatting(this.message.author.tag)}`)
            .addFields(
                /** @type {any} */
                { name: 'Usage', value: `\`${this.prefix}${this.name} ${commandName} ${subCommand.usage}\``, inline: true},
                /** @type {any} */ { name: 'Description', value: subCommand.description, inline: true},
                /** @type {any} */ { name: 'Required Permissions', value: this.constructor.userPerms.map(p => `\`${p}\``).join(',') || 'none' }
            )
            .setColor(util.color.green)
            .setTimestamp()
        );
    }
}

module.exports = AutoResponseCommand;
