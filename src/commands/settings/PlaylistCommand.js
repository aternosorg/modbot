const Command = require('../../Command');
const util = require('../../util.js');
const Discord = require('discord.js');
const youtube = require('@googleapis/youtube').youtube('v3');
const {googleapikey} = require('../../../config.json');

class PlaylistCommand extends Command {

    static description = 'Configure a YouTube playlist for the video command';

    static usage = '<link|id>|off|status';

    static names = ['playlist'];

    static userPerms = ['MANAGE_GUILD'];

    async execute() {
        if (this.args.length !== 1) {
            await this.sendUsage();
            return;
        }

        switch (this.args[0].toLowerCase()) {
            case 'off':
                this.guildConfig.playlist = null;
                await this.guildConfig.save();
                await this.reply(new Discord.MessageEmbed()
                    .setDescription('Disabled YouTube playlist')
                    .setColor(util.color.red)
                );
                break;
            case 'status':
                await this.reply(new Discord.MessageEmbed()
                    .setDescription(`Playlist: ${this.guildConfig.playlist ? `https://www.youtube.com/playlist?list=${this.guildConfig.playlist}` : 'disabled'}`)
                );
                break;
            default: {
                let playlistID = this.args.shift().match(/^(?:(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*[&?]list=)?([a-zA-Z0-9\-_]+?)(?:&.*)?$/);
                if(playlistID) playlistID = playlistID[1];
                if (playlistID === null) return this.sendUsage();

                const response = await youtube.playlists.list({
                    auth: googleapikey,
                    part: 'id',
                    id: playlistID
                });

                if (response.data.items.length === 0) return this.sendUsage();

                this.guildConfig.playlist = playlistID;
                await this.guildConfig.save();
                await this.reply(new Discord.MessageEmbed()
                    .setDescription(`Set playlist to https://www.youtube.com/playlist?list=${playlistID}`)
                );
            }
        }
    }
}

module.exports = PlaylistCommand;
