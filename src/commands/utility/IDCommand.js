const Command = require('../../Command');
const {User, MessageEmbed} = require('discord.js');
const util = require('../../util');

const resultLimit = 150;

class IDCommand extends Command {

    static description = 'Search for a user\'s ID in the member and ban list.';

    static usage = '<username|username#1234>';

    static names = ['id']

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    static supportsSlashCommands = true;

    async execute() {
        await this.source.defer();
        const query = this.options.getString('username');
        if (!query) return this.sendUsage();

        const [,user, discrim] = query.match(/([^#]*)#?(\d{4})?$/);

        let [users, bans] = await Promise.all([
            this.source.getGuild().members.fetch({query}),
            this.source.getGuild().bans.fetch(),
        ]);

        users = users.concat(bans.filter(banInfo => this._matches(banInfo.user, user, discrim)));

        const embed = new MessageEmbed()
            .setTitle(`User search for ${query}`);
        if (users.size === 0) {
            return this.sendError('No users found');
        }

        if (users.size > resultLimit) {
            embed.setTitle(`First ${resultLimit} results of user search for ${query}`);
            users = Array.from(users.values()).slice(0, resultLimit);
        }

        users = users.map(u => `${util.escapeFormatting(u.user.tag)}: ${u.user.id}`);
        embed.setColor(util.color.green);
        while (users.length) {
            let list = '';

            while (users.length && list.length + users[0].length < 2000) {
                list += users.shift() + '\n';
            }
            embed.setDescription(list);
            await this.reply(embed);
        }
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
