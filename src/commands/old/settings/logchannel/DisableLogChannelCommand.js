const SubCommand = require('../../SubCommand.js');
const {MessageEmbed} = require('discord.js');
const util = require('../../../../util.js');

class DisableLogChannelCommand extends SubCommand {
    static names = ['disable', 'off'];

    static description = 'Disable moderation log';

    async execute() {
        this.guildConfig.joinLogChannel = null;
        await this.guildConfig.save();
        await this.reply(new MessageEmbed()
            .setDescription('Disabled moderation log')
            .setColor(util.color.red)
        );
    }
}

module.exports = DisableLogChannelCommand;
