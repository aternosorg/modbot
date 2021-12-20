const SetConfigCommand = require('../../SubCommand');
const {MessageEmbed} = require('discord.js');
const util = require('../../../util');

class SetJoinLogCommand extends SetConfigCommand {
    static description = 'Disable join logs';

    async execute() {
        this.guildConfig.joinLogChannel = null;
        await this.guildConfig.save();
        await this.reply(new MessageEmbed()
            .setDescription('Disabled join logs')
            .setColor(util.color.red)
        );
    }
}

module.exports = SetJoinLogCommand;
