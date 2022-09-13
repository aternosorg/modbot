const SetConfigCommand = require('../../SetConfigCommand.js');
const {MessageEmbed} = require('discord.js');
const util = require('../../../../util.js');
const youtube = require('@googleapis/youtube').youtube('v3');
const {googleapikey} = require('../../../../../config.json');
const VideoCommand = require('../../utility/VideoCommand.js');

class SetPlaylistCommand extends SetConfigCommand {
    static usage = '<#channel|channelid>';

    static description = 'Set a YouTube playlist';

    async execute() {
        const playlist = this.options.getString('playlist')
            .match(/^(?:(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*[&?]list=)?([a-zA-Z0-9\-_]+?)(?:&.*)?$/)
            ?.at(1);

        if (!playlist) {
            await this.sendUsage();
            return;
        }

        const response = await youtube.playlists.list({
            auth: googleapikey,
            part: 'id',
            id: playlist
        });

        if (response.data.items.length === 0) {
            await this.reply('Playlist not found. Make sure the playlist is public or unlisted and the link is correct.');
            return;
        }

        this.guildConfig.playlist = playlist;
        VideoCommand.clearGuildCache(this.source.getGuild().id);

        await this.guildConfig.save();
        await this.reply(new MessageEmbed()
            .setDescription(`Set playlist to https://www.youtube.com/playlist?list=${playlist}`)
            .setColor(util.color.green)
        );
    }

    static getOptions() {
        return [{
            name: 'playlist',
            type: 'STRING',
            description: 'Link to a YouTube playlist used for the /video command',
            required: true
        }];
    }

    parseOptions(args) {
        return [{
            name: 'playlist',
            type: 'STRING',
            value: args.shift() || ''
        }];
    }
}

module.exports = SetPlaylistCommand;
