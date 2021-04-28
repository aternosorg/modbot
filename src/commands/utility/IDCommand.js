const Command = require('../../Command');
const Discord = require('discord.js');
const util = require('../../util');

class IDCommand extends Command {

    static description = 'Find a user\'s ID';

    static usage = '<username|username#1234>';

    static names = ['id']

    static userPerms = ['VIEW_AUDIT_LOG'];

    static modCommand = true;

    async execute() {
        if (!this.args.length) return this.sendUsage();

        const fullName = this.args.join(' ');
        let users = new Discord.Collection();
        const [,name, discrim] = fullName.match(/(.*)#?(\d{4})?$/);

        const members = await this.message.guild.members.fetch();
        const bans = await this.message.guild.fetchBans();

        users = users.concat(members.filter(member => this._matches(member.user, name, discrim)));
        users = users.concat(bans.filter(banInfo => this._matches(banInfo.user, name, discrim)));

        const embed = new Discord.MessageEmbed()
            .setTitle(`User search for ${fullName}`);
        if (users.size === 0) {
            embed.setDescription("No users found")
                .setColor(util.color.red);
            return await this.message.channel.send(embed);
        }
        if (users.size > 150) {
            embed.setDescription("Too many users found.")
                .setColor(util.color.red);
            return await this.message.channel.send(embed);
        }

        users = users.map(u => `${u.user.tag}: ${u.user.id}`);
        embed.setColor(util.color.green);
        while (users.length) {
            let list = "";

            while (users.length && list.length + users[0].length < 2000) {
                list += users.shift() + "\n";
            }
            embed.setDescription(list);
            await this.message.channel.send(embed);
        }
    }

    /**
     *
     * @param {module:"discord.js".User} user
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
