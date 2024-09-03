import Cache from '../bot/Cache.js';
import config from '../bot/Config.js';
import {youtube as youtube_fn} from '@googleapis/youtube';
import Fuse from 'fuse.js';
import {hyperlink} from 'discord.js';
const youtube = youtube_fn('v3');

const CACHE_DURATION = 10 * 60 * 1000;
/** @type {Cache<string, YouTubeVideo[]>} */
const cache = new Cache();

/**
 * @typedef {object} PlaylistResponse
 * @property {PlaylistResponseData} data
 * @property {string} etag
 * @property {string} nextPageToken
 */

/**
 * @typedef {object} PlaylistResponseData
 * @property {PageInfo} pageInfo
 * @property {YouTubeVideo[]} items
 */

/**
 * @typedef {object} PageInfo
 * @property {number} totalResults
 * @property {number} resultsPerPage
 */

/**
 * @typedef {object} YouTubeVideo
 * @property {string} etag
 * @property {YouTubeVideoSnippet} snippet
 */

/**
 * @typedef {object} YouTubeVideoSnippet
 * @property {string} title
 * @property {string} description
 * @property {SnippetResourceId} resourceId
 */

/**
 * @typedef {object} SnippetResourceId
 * @property {string} videoId
 */

export default class YouTubePlaylist {
    #id;

    constructor(id) {
        this.#id = id;
    }

    /**
     * is this a valid playlist id
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    static async isValidPlaylist(id) {
        const response = await youtube.playlists.list({
            auth: config.data.googleApiKey,
            part: 'id',
            id
        });

        return !!response.data.items.length;
    }

    /**
     * delete the cache for this playlist
     */
    clearCache() {
        cache.delete(this.#id);
    }

    /**
     * get all videos in this playlist
     * @returns {Promise<YouTubeVideo[]>}
     */
    async getVideos() {
        const cacheEntry = cache.getEntry(this.#id);
        if (cacheEntry) {
            return cacheEntry.value;
        }

        /** @type {YouTubeVideo[]} */
        const videos = [];
        let totalVideos = 0, nextPageToken = null;
        do {
            const response = /** @type {PlaylistResponse} */ await youtube.playlistItems.list({
                auth: config.data.googleApiKey,
                part: 'snippet,contentDetails,id',
                playlistId: this.#id,
                maxResults: 50,
                pageToken: nextPageToken
            });
            totalVideos = response.data.pageInfo.totalResults;
            videos.push(...response.data.items);
            nextPageToken = response.data.nextPageToken;
        } while (videos.length < totalVideos);

        cache.set(this.#id, videos, CACHE_DURATION);
        return videos;
    }

    /**
     * search for videos in this playlist
     * searches in title and description
     * @param {string} query
     * @returns {Promise<(import('fuse.js').Fuse.FuseResult<YouTubeVideo>)[]>}
     */
    async searchVideos(query) {
        const videos = await this.getVideos();
        const fuse = new Fuse(videos, {
            keys: ['snippet.title', 'snippet.description'],
            includeScore: true
        });
        return fuse.search(query);
    }

    getUrl() {
        return `https://www.youtube.com/playlist?list=${this.#id}`;
    }

    getFormattedUrl() {
        return hyperlink(this.#id, this.getUrl(), 'YouTube playlist ID');
    }
}