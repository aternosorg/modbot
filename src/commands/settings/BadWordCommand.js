const Command = require('../../Command');
const Discord = require('discord.js');
const util = require('../../util');
const BadWord = require('../../BadWord');

class BadWordCommand extends Command {

    static description = 'Configure bad words';

    static usage = 'list|add|remove|show|edit';

    static subCommands = {
        list: {
            usage:'',
            description: 'List all bad words'
        },
        add: {
            usage: 'global|<channels> regex|include|match <trigger>',
            description: 'Add a bad word'
        },
        remove: {
            usage: '<id>',
            description: 'Remove a bad word'
        },
        show: {
            usage: '<id>',
            description: 'Display a bad word'
        },
        edit: {
            usage: '<id> trigger|response|punishment|priority|channels <value>',
            description: 'change options of a bad word'
        }
    }

    static names = ['badword','badwords','bw'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length === 0) {
            await this.sendUsage();
            return;
        }

        /** @type {module:"discord.js".Collection<Number,ChatTriggeredFeature>} */
        const badWords = await BadWord.getAll(/** @type {Snowflake} */ this.message.guild.id);

        switch (this.args.shift().toLowerCase()) {
            case 'list': {
                if (!badWords.size) return this.message.channel.send('No bad words!');

                let text = '';
                for (const [id, badWord] of badWords) {
                    const info = `[${id}] ${badWord.global ? 'global' : badWord.channels.map(c => `<#${c}>`).join(', ')} ` +
                        '`' + badWord.trigger.asString() + '`\n';

                    if (text.length + info.length < 2000) {
                        text += info;
                    } else {
                        await this.message.channel.send(text);
                        text = info;
                    }
                }
                if (text.length) await this.message.channel.send(text);
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

                let badWord = await BadWord.new(this.message.guild.id, global, channels, type, content);
                if (!badWord.success) return this.message.channel.send(badWord.message);

                await this.message.channel.send(badWord.badWord.embed('Added new bad word', util.color.green));
                break;
            }

            case 'remove': {
                const badWord = await this.getBadWord(this.args.shift(), 'remove');
                if (!badWord) return;
                await badWord.remove();
                await this.message.channel.send(badWord.embed(`Removed bad word ${badWord.id}`, util.color.red));
                break;
            }

            case 'show': {
                const badWord = await this.getBadWord(this.args.shift(), 'remove');
                if (!badWord) return;
                await this.message.channel.send(badWord.embed(`Bad Word ${badWord.id}`, util.color.green));
                break;
            }

            case 'edit': {
                if (this.args.length < 3) return this.sendSubCommandUsage('edit');
                const badWord = await this.getBadWord(this.args.shift(), 'edit');
                if (!badWord) return;

                const edit = await badWord.edit(this.args.shift(), this.args, this.message.guild);

                if (!edit.success) {
                    return this.sendError(edit.message);
                }

                await this.message.channel.send(badWord.embed(edit.message, util.color.green));
                break;
            }

            default:
                await this.sendUsage();
        }

    }

    /**
     * get a single bad word
     * @param {String|Number} id
     * @param {String} subCommand
     * @returns {Promise<BadWord|null>}
     */
    async getBadWord(id, subCommand) {
        if (!id || !parseInt(id)) {
            await this.sendSubCommandUsage(subCommand);
            return null;
        }
        const result = await BadWord.getByID(id);
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

        return this.message.channel.send(new Discord.MessageEmbed()
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

module.exports = BadWordCommand;
