const Command = require('../../Command');
const {Collection, MessageOptions} = require('discord.js');
const youtube = require('@googleapis/youtube').youtube('v3');
const {googleapikey} = require('../../../config.json');
const Fuse = require('fuse.js');

class VideoCommand extends Command {

    static description = 'Search videos in your YouTube playlist';

    static usage = '<query>';

    static names = ['video','tutorial','v'];

    static comment = 'The playlist can be configured with the `playlist` command';

    static supportsSlashCommands = true;

    static ephemeral = false;

    /**
     * playlist cache
     * @type {Collection<String, {data: Object, expires: Number}[]>}
     */
    static #cache = new Collection();

    /**
     * remove expired cache
     */
    static #clearCache = setInterval(() => {
        for (const [key, value] of this.#cache) {
            if (value.expires < Date.now()) {
                this.#cache.delete(key);
            }
        }
    }, 60*1000);

    async execute() {
        if (!this.guildConfig.playlist) {
            return this.sendError('No playlist specified!');
        }

        const query = this.options.getString('query');
        if (!query) {
            await this.sendUsage();
            return;
        }

        let videos;
        try {
            videos = await this.constructor._get(this.guildConfig.playlist);
        }
        catch (e) {
            if (e.response.data.error.code === 404) {
                return this.sendError('The playlist couln\'t be found. It was most likely deleted or set to private!');
            }
            throw e;
        }
        const video = new Fuse(videos, {keys:['snippet.title']}).search(query)[0];

        if (!video) {
            return this.sendError('No video found!');
        }

        /** @type {MessageOptions} */
        const options = {content: `https://youtu.be/${video.item.snippet.resourceId.videoId}`};

        if (!this.source.isInteraction && this.userConfig.deleteCommands && this.source.getRaw().reference) {
            options.reply = {
                messageReference: this.source.getRaw().reference.messageId,
                failIfNotExists: false
            };
        }

        await this.reply(options);
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
            this.#cache.set(playlist, {data: response.data.items, expires: Date.now() + 10*60*1000});
        }

        return this.#cache.get(playlist).data;
    }

    static getOptions() {
        return [{
            name: 'query',
            type: 'STRING',
            description: 'Search query',
            required: true,
        }];
    }

    parseOptions(args) {
        return [
            {
                name: 'query',
                type: 'STRING',
                value: args.join(' '),
            }
        ];
    }
}

module.exports = VideoCommand;
