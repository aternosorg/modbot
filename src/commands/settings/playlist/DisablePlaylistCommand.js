const SubCommand = require('../../SubCommand');
const {MessageEmbed} = require('discord.js');
const util = require('../../../util');

class DisablePlaylistCommand extends SubCommand {
    static names = ['disable', 'off'];

    static description = 'Disable the YouTube playlist';

    async execute() {
        this.guildConfig.playlist = null;
        await this.guildConfig.save();
        await this.reply(new MessageEmbed()
            .setDescription('Disabled the YouTube playlist')
            .setColor(util.color.red)
        );
    }
}

module.exports = DisablePlaylistCommand;
