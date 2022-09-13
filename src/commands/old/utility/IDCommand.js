/**
 * Discord bans fetched per page
 * @type {number}
 */
const BAN_PAGE_SIZE = 1000;

const Command = require('../OldCommand.js');
const {
    User,
    MessageEmbed,
    GuildMember,
    GuildBan,
    Snowflake,
    Collection
} = require('discord.js');
const util = require('../../../util.js');

class IDCommand extends OldCommand {

    static description = 'Search for a user\'s ID in the member and ban list.';

    static usage = '<username|username#1234>';

    static names = ['id'];

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    async execute() {
        await this.defer();
        const query = this.options.getString('username');
        if (!query) return this.sendUsage();

        const [,user, discrim] = query.match(/([^#]*)#?(\d{4})?$/);

        const users = /** @type {Collection<Snowflake, GuildMember>} */ await this.source.getGuild().members.fetch({query});

        let replied = false;
        if (users.size !== 0) {
            await this.editReply(this._generateResultEmbed(query, Array.from(users.values()))
                .setFooter({text: 'I\'m still searching in the ban list, on guilds with a lot of bans this can take a while...'}));
            replied = true;
        }
        const bans = await this._fetchAndFilterBans(user, discrim);
        if (bans.size === 0 && !replied) {
            return this.sendError('No users found');
        }
        else {
            // noinspection JSCheckFunctionSignatures
            await this.editReply(this._generateResultEmbed(query, Array.from(users.concat(bans).values())));
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
     * @param {string} user
     * @param {string} discrim
     * @return {Promise<Collection<Snowflake, GuildBan>>}
     * @private
     */
    async _fetchAndFilterBans(user, discrim) {
        return (await this._fetchAllBans()).filter(banInfo => this._matches(banInfo.user, user, discrim));
    }

    /**
     * fetch all bans
     * @return {Promise<Collection<Snowflake, GuildBan>>}
     * @private
     */
    async _fetchAllBans() {
        let bans = new Collection();
        let done = false, previous = null;
        while (!done) {
            const options = {
                limit: BAN_PAGE_SIZE
            };
            if (previous !== null) {
                options.after = previous;
            }

            const newBans = /** @type {Collection<Snowflake, GuildBan>}*/ await this.source.getGuild().bans.fetch(options);
            bans = bans.concat(newBans);
            previous = newBans.lastKey();

            if (newBans.size < BAN_PAGE_SIZE) {
                done = true;
            }
        }
        return bans;
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
