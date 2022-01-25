const Command = require('../Command');
const {
    User,
    MessageEmbed,
    GuildMember,
    GuildBan,
    Snowflake,
    Collection
} = require('discord.js');
const util = require('../../util');

class IDCommand extends Command {

    static description = 'Search for a user\'s ID in the member and ban list.';

    static usage = '<username|username#1234>';

    static names = ['id'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    static supportsSlashCommands = true;

    async execute() {
        await this.defer();
        const query = this.options.getString('username');
        if (!query) return this.sendUsage();

        const [,user, discrim] = query.match(/([^#]*)#?(\d{4})?$/);

        /**
         * @type {Collection<Snowflake, GuildMember|GuildBan>}
         */
        let users = await this.source.getGuild().members.fetch({query});

        if (users.size !== 0) {
            await this.reply(this._generateResultEmbed(query, Array.from(users.values()))
                .setFooter({text: 'I\'m still searching the ban, on big guilds this can take a while...'}));

            let bans = await this.source.getGuild().bans.fetch();
            bans = bans.filter(banInfo => this._matches(banInfo.user, user, discrim));
            users = users.concat(bans);
            await this.editReply(this._generateResultEmbed(query, Array.from(users.values())));
        } else {
            let bans = await this.source.getGuild().bans.fetch();
            bans = bans.filter(banInfo => this._matches(banInfo.user, user, discrim));
            if (bans.size === 0) {
                return this.sendError('No users found');
            }
            else {
                await this.editReply(this._generateResultEmbed(query, Array.from(bans.values())));
            }
        }
    }

    /**
     * generate an embed of results
     * @param {String} query
     * @param {(GuildMember|GuildBan)[]} results
     * @return {MessageEmbed}
     * @private
     */
    _generateResultEmbed(query, results) {
        const entries = results.map(u => `${util.escapeFormatting(u.user.tag)}: ${u.user.id}`);
        let description = '', complete = true, count = 0;
        for (const entry of entries) {
            if (description.length + entry.length <= 4096) {
                description += entry + '\n';
                count ++;
            }
            else {
                complete = false;
                break;
            }
        }

        return new MessageEmbed()
            .setTitle(`${complete ? count : `First ${count}`} results for '${query}'`)
            .setDescription(description)
            .setColor(util.color.green);
    }

    /**
     *
     * @param {User} user
     * @param {string} name
     * @param {string} discriminator
     * @returns {boolean}
     * @private
     */
    _matches(user, name, discriminator) {
        return user.username.toLowerCase().includes(name.toLowerCase()) && (!discriminator || user.discriminator === discriminator);
    }

    static getOptions() {
        return [{
            name: 'username',
            type: 'STRING',
            description: 'Discord username or tag',
            required: true,
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'username',
                type: 'STRING',
                value: args.join(' '),
            }
        ];
    }
}

module.exports = IDCommand;
