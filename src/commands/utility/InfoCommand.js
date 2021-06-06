const Command = require('../../Command');
const Discord = require('discord.js');
const util = require('../../util');

class InfoCommand extends Command {

    static description = 'Show information about ModBot';

    static names = ['info', 'invite'];

    static userPerms = [];

    static botPerms = [];

    async execute() {
        const embed = new Discord.MessageEmbed()
            .setTitle('ModBot by Aternos')
            .setDescription(
            '[ModBot](https://github.com/aternosorg/modbot/) is a moderation bot developed by [Aternos](https://aternos.org/)\n\n' +
            '[[Privacy Policy]](https://aternos.gmbh/en/modbot/privacy) ' +
            '[[Invite]](https://discordapp.com/oauth2/authorize?client_id=790967448111153153&scope=bot&permissions=268446806) '+
            '[[GitHub]](https://github.com/aternosorg/modbot/) ' +
            '[[Discord]](https://discord.gg/zYYhgPtmxw) '
            )
            .setTimestamp()
            .setFooter(util.escapeFormatting(this.message.author.tag));
        await this.message.channel.send(embed);
    }
}

module.exports = InfoCommand;
