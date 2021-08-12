const Command = require('../../Command');
const {User, Collection, MessageEmbed} = require('discord.js');
const util = require('../../util');

const resultLimit = 150;

class IDCommand extends Command {

    static description = 'Find a user\'s ID';

    static usage = '<username|username#1234>';

    static names = ['id']

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    async execute() {
        if (!this.args.length) return this.sendUsage();

        const fullName = this.args.join(' ');
        let users = new Collection();
        const [,name, discrim] = fullName.match(/([^#]*)#?(\d{4})?$/);

        const members = await this.message.guild.members.fetch();
        const bans = await this.message.guild.fetch();

        users = users.concat(members.filter(member => this._matches(member.user, name, discrim)));
        users = users.concat(bans.filter(banInfo => this._matches(banInfo.user, name, discrim)));

        const embed = new MessageEmbed()
            .setTitle(`User search for ${fullName}`);
        if (users.size === 0) {
            embed.setDescription('No users found')
                .setColor(util.color.red);
            return await this.reply(embed);
        }
        if (users.size > resultLimit) {
            embed.setTitle(`First ${resultLimit} results of user search for ${fullName}`);
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
}

module.exports = IDCommand;
