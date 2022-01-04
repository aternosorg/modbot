const GetConfigCommand = require('../../GetConfigCommand');
const {MessageEmbed} = require('discord.js');
const util = require('../../../util.js');

class GetMessageLogCommand extends GetConfigCommand {
    static names = ['get','status'];

    async execute() {
        await this.reply(new MessageEmbed()
            .setDescription(`Deleted and edited messages are currently ${this.guildConfig.messageLogChannel ? 
                `logged to <#${this.guildConfig.messageLogChannel}>` : 'not logged'}.`)
            .setColor(this.guildConfig.messageLogChannel ? util.color.green : util.color.red)
        );
    }
}

module.exports = GetMessageLogCommand;
