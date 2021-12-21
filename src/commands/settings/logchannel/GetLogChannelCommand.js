const GetConfigCommand = require('../../GetConfigCommand');
const {MessageEmbed} = require('discord.js');
const util = require('../../../util.js');

class GetLogChannelCommand extends GetConfigCommand {
    static names = ['get','status'];

    async execute() {
        await this.reply(new MessageEmbed()
            .setDescription(`Moderations are currently ${this.guildConfig.logChannel ? `logged to <#${this.guildConfig.logChannel}>` : 'not logged'}.`)
            .setColor(this.guildConfig.logChannel ? util.color.green : util.color.red)
        );
    }
}

module.exports = GetLogChannelCommand;
