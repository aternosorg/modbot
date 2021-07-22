const Command = require('../../Command');
const {MessageEmbed, Message} = require('discord.js');
const util = require('../../util');
const regexRegex = /^\/(.*)\/([gimsuy]*)$/;
const Log = require('../../Log');

class PurgeCommand extends Command {

    static description = 'Bulk delete messages';

    static usage = '[</regex/>] [<@users>] [<userIDs>] [<text>] [<count>]';

    static names = ['purge', 'clean', 'clear'];

    static modCommand = true;

    static userPerms = ['MANAGE_MESSAGES'];

    static botPerms = ['MANAGE_MESSAGES'];

    async execute() {
        if (this.args.length === 0) return this.sendUsage();

        const filter = {
            users: []
        };

        for (const arg of this.args) {
            if (await util.isUserMention(arg)) {
                filter.users.push(util.userMentionToId(arg));
                continue;
            }

            if (regexRegex.test(arg)) {
                if (filter.regex) return this.sendError('Only one regex is allowed.');
                const match = arg.match(regexRegex);
                try {
                    filter.regex = new RegExp(match[1], match[2]);
                } catch {
                    return this.sendError(`Invalid regex: \`${arg}\``);
                }
                continue;
            }

            if (/^\d+$/.test(arg)) {
                if (filter.count) return this.sendError('Only one count is allowed.');
                filter.count = parseInt(arg);
                if (filter.count > 1000) return this.sendError('You can\'t purge more than 1000 messages.');
                continue;
            }

            if (filter.string) return this.sendError('Only one string match is allowed.');
            filter.string = arg.toLowerCase();
        }

        let messages = await util.getMessages(this.message.channel, {
            before: this.message.id,
            limit: filter.count || 100
        });

        messages = messages.filter(/** @type {Message} */message => {
            if (this.message.createdAt - message.createdAt > 14*24*60*60*1000) return false;
            if (filter.users.length && !filter.users.includes(message.author.id)) return false;
            if (filter.regex && !this.matches(message, s => filter.regex.test(s))) return false;
            return !filter.string || this.matches(message, s => s.toLowerCase().includes(filter.string));
        });

        if (messages.size === 0) return this.sendError('No matching messages found!');

        const embed = new MessageEmbed()
            .setAuthor(`${this.message.author.tag} purged ${messages.size} messages`)
            .addField('Channel', `<#${this.message.channel.id}>`, true)
            .setFooter(this.message.author.id);

        if (filter.users.length) embed.addField('Users', filter.users.map(u => `<@!${u}>`).join(', '), true);
        if (filter.regex) embed.addField('Regex', '`' + filter.regex + '`', true);
        if (filter.count) embed.addField('Tested messages', filter.count.toString(), true);

        await Promise.all([
            util.delete(this.message),
            util.bulkDelete(this.message.channel, messages),
            Log.logEmbed(this.message.guild.id, embed)
        ]);

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
}

module.exports = PurgeCommand;
