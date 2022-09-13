const GetConfigCommand = require('../../GetConfigCommand.js');
const {MessageEmbed} = require('discord.js');
const util = require('../../../../util.js');

class GetPlaylistCommand extends GetConfigCommand {
    static names = ['get','status'];

    async execute() {
        await this.reply(new MessageEmbed()
            .setDescription(`Playlist: ${this.guildConfig.playlist ? `https://www.youtube.com/playlist?list=${this.guildConfig.playlist}` : 'disabled'}`)
            .setColor(this.guildConfig.playlist ? util.color.green : util.color.red)
        );
    }
}

module.exports = GetPlaylistCommand;
