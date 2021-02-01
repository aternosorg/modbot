const Command = require('../../Command')
const Discord = require('discord.js');

class AvatarCommand extends Command{

    static names = ['avatar', 'av'];

    static usage = '[<@user|id>]';

    static description = 'Show someones avatar';

    async execute() {
        /** @type {module:"discord.js".User|Snowflake} */
        let user = this.args.length ? util.userMentionToId(this.args[0]) : this.message.author;
        if (!(user instanceof Discord.User)) {
            try {
                user = await this.bot.users.fetch(user);
            }
            catch (e) {
                if (e.httpStatus === 404) {
                    await this.sendUsage();
                    return;
                }
                throw e;
            }
        }
        const avatarEmbed = new Discord.MessageEmbed()
            .setTitle(`Avatar of ${user.username}`)
            .setImage(user.displayAvatarURL({dynamic: true, size: 512}))
            .setFooter(`Command executed by ${this.message.author.username}`)
            .setTimestamp();

        await this.message.channel.send(avatarEmbed);
    }
}

module.exports = AvatarCommand;
