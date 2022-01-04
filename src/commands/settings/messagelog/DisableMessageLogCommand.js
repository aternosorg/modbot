const SubCommand = require('../../SubCommand');
const {MessageEmbed} = require('discord.js');
const util = require('../../../util');

class DisableMessageLogCommand extends SubCommand {
    static names = ['disable', 'off'];

    static description = 'Disable message logs';

    async execute() {
        this.guildConfig.messageLogChannel = null;
        await this.guildConfig.save();
        await this.reply(new MessageEmbed()
            .setDescription('Disabled message logs')
            .setColor(util.color.red)
        );
    }
}

module.exports = DisableMessageLogCommand;
