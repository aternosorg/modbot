const Command = require('../OldCommand.js');
const {MessageEmbed, Message} = require('discord.js');
const util = require('../../../util.js');
const regexRegex = /^\/(.*)\/([gimsuy]*)$/;
const Log = require('../../../discord/GuildLog.js');

class PurgeCommand extends OldCommand {

    static description = 'Bulk delete messages';

    static usage = '[</regex/>] [<@users|userIDs>] [<content>] [<limit>]';

    static names = ['purge', 'clean', 'clear'];

    static modCommand = true;

    static userPerms = ['MANAGE_MESSAGES'];

    static botPerms = ['MANAGE_MESSAGES'];

    async execute() {
        await this.defer();
        const filter = {
            content: this.options.getString('content'),
            users: this.options.getUser('user') ? [this.options.getUser('user')?.id] : this.options.get('users')?.value ?? [],
            regex: this.options.getString('regex'),
            limit: this.options.getInteger('limit'),
        };

        if (filter.regex) {
            const match = filter.regex.match(regexRegex);
            try {
                filter.regex = new RegExp(match[1], match[2]);
            } catch {
                return this.sendError(`Invalid regex: \`${filter.regex}\``);
            }
        }

        if (filter.limit > 1000) {
            return this.sendError('You can\'t purge more than 1000 messages.');
        }

        for (const user of filter.users) {
            if (!await util.isUserMention(user)) {
                return this.sendError(`Unknow user <@!${user}>!`);
            }
        }

        //Verify that at least one filter exists
        if (!filter.content && filter.users.length === 0 && !filter.regex && !filter.limit) {
            return this.sendUsage();
        }

        let messages = await util.getMessages(this.source.getChannel(), {
            limit: filter.limit ?? 100
        });

        messages = messages.filter(/** @type {Message} */message => {
            if (filter.users.length && !filter.users.includes(message.author.id)) return false;
            if (filter.regex && !this.matches(message, s => filter.regex.test(s))) return false;
            return !filter.content || this.matches(message, s => s.toLowerCase().includes(filter.content));
        });

        if (messages.size === 0) return this.sendError('No matching messages found!');

        const embed = new MessageEmbed()
            .setAuthor({name: `${this.source.getUser().tag} purged ${messages.size} messages`})
            .addField('Channel', `<#${this.source.getChannel().id}>`, true)
            .setFooter({text: this.source.getUser().id.toString()});

        if (filter.users.length) embed.addField('Users', filter.users.map(u => `<@!${u}>`).join(', '), true);
        if (filter.regex) embed.addField('Regex', '`' + filter.regex + '`', true);
        if (filter.count) embed.addField('Tested messages', filter.count.toString(), true);

        await Promise.all([
            util.bulkDelete(this.source.getChannel(), messages),
            Log.logEmbed(this.source.getGuild().id, embed)
        ]);

        if (!this.source.isInteraction) {
            await util.delete(this.source.getRaw());
        }

        await this.reply(new MessageEmbed()
            .setColor(util.color.green)
            .setDescription(`Deleted ${messages.size} messages`)
        );
        return util.delete(this.response,{timeout: 5000});
    }

    /**
     *
     * @param {Message} message
     * @param {function} fn
     * @return {boolean}
     */
    matches(message, fn) {
        /** @type {String[]} */
        const contents = [];
        contents.push(message.content);
        for (const embed of message.embeds) {
            contents.push(embed.description, embed.title, embed.footer?.text, embed.author?.name);
            for (const field of embed.fields) {
                contents.push(field.name, field.value);
            }
        }
        return contents.filter(s => !!s).some(fn);
    }

    static getOptions() {
        return [{
            name: 'content',
            type: 'STRING',
            description: 'Only delete messages that include this string',
            required: false,
        },{
            name: 'user',
            type: 'USER',
            description: 'Only delete messages from this user',
            required: false,
        },{
            name: 'regex',
            type: 'STRING',
            description: 'Only delete messages that match this regex',
            required: false,
        },{
            name: 'limit',
            type: 'INTEGER',
            description: 'Amount of messages to test against filters (default: 100)',
            required: false,
            min_value: 1,
            max_value: 1000,
        }];
    }

    parseOptions(args) {
        const users = [];
        let regex = null,
            limit = null,
            content = null;
        for (const arg of args) {
            if (regexRegex.test(arg)) {
                regex = arg;
                continue;
            }

            if (/^\d+$/.test(arg)) {
                limit = parseInt(arg);
                continue;
            }

            if (/^(<@)?!?\d{15,}>?$/.test(arg) && util.userMentionToId(arg)) {
                users.push(util.userMentionToId(arg));
                continue;
            }

            content = arg.toLowerCase();
        }
        return [{
            name: 'content',
            type: 'STRING',
            value: content,
        }, {
            name: 'users',
            type: 'USERS',
            value: users,
        }, {
            name: 'regex',
            type: 'STRING',
            value: regex,
        },{
            name: 'limit',
            type: 'INTEGER',
            value: limit,
        }];
    }
}

module.exports = PurgeCommand;
