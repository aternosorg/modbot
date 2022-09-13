const GetConfigCommand = require('../../GetConfigCommand.js');
const {MessageEmbed} = require('discord.js');
const util = require('../../../../util.js');

class GetJoinLogCommand extends GetConfigCommand {
    static names = ['get','status'];

    async execute() {
        await this.reply(new MessageEmbed()
            .setDescription(`New members are currently ${this.guildConfig.joinLogChannel ? `logged to <#${this.guildConfig.joinLogChannel}>` : 'not logged'}.`)
            .setColor(this.guildConfig.joinLogChannel ? util.color.green : util.color.red)
        );
    }
}

module.exports = GetJoinLogCommand;
