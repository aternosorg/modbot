const Command = require('../../Command');
const {Collection} = require('discord.js');
const youtube = require('@googleapis/youtube').youtube('v3');
const {googleapikey} = require('../../../config.json');
const Fuse = require('fuse.js');

class VideoCommand extends Command {

    static description = 'Search videos in your YouTube playlist';

    static usage = '<query>';

    static names = ['video','tutorial','v'];

    static comment = 'The playlist can be configured with the `playlist` command';

    /**
     * playlist cache
     * @type {module:"discord.js".Collection<String, Object[]>}
     */
    static #cache = new Collection();

    async execute() {
        if (!this.guildConfig.playlist) return this.message.channel.send('No playlist specified!');

        const query = this.args.join(' ');
        if (!query) return this.sendUsage();

        let videos;
        try {
            videos = await this.constructor._get(this.guildConfig.playlist);
        }
        catch (e) {
            if (e.response.data.error.code === 404) {
                return this.message.channel.send('The playlist couln\'t be found. It was most likely deleted or set to private!');
            }
            throw e;
        }
        const video = new Fuse(videos, {keys:['snippet.title']}).search(query)[0];

        if (!video) return this.message.channel.send('No video found!');

        await this.message.channel.send(`https://youtu.be/${video.item.snippet.resourceId.videoId}`);
    }

    /**
     * get (the first 100) videos from this playlist
     * @param {String} playlist playlist id
     * @return {Promise<Object[]>}
     * @private
     */
    static async _get(playlist) {
        if (!this.#cache.has(playlist)) {
            const response = await youtube.playlistItems.list({
                auth: googleapikey,
                part: 'snippet,contentDetails,id',
                playlistId: playlist,
                maxResults: 100
            });
            this.#cache.set(playlist, response.data.items);
            setTimeout(() => {
                this.#cache.delete(playlist);
            }, 10*60*1000);
        }

        return this.#cache.get(playlist);
    }
}

module.exports = VideoCommand;
