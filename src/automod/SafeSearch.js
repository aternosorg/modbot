import config from '../bot/Config.js';
import GuildSettings from '../settings/GuildSettings.js';
import vision from '@google-cloud/vision';
import Cache from '../bot/Cache.js';
import Request from '../bot/Request.js';
import database from '../bot/Database.js';

const CACHE_DURATION = 60 * 60 * 1000;

export default class SafeSearch {
    #cache = new Cache();

    constructor() {
        if (this.isEnabled) {
            this.annotatorClient = new vision.ImageAnnotatorClient({
                credentials: config.data.googleCloud.credentials
            });
        }
    }

    get isEnabled() {
        return config.data.googleCloud.vision?.enabled;
    }

    /**
     * is safe search filtering enabled in this guild
     * @param {import('discord.js').Guild} guild
     * @return {Promise<boolean>}
     */
    async isEnabledInGuild(guild) {
        if (!this.isEnabled) {
            return false;
        }

        const guildSettings = await GuildSettings.get(guild.id);
        return guildSettings.isFeatureWhitelisted && guildSettings.safeSearch.enabled;
    }

    /**
     * detect images in this message using the safe search api
     * @param {import('discord.js').Message} message
     * @return {Promise<?{type: string, value: number}>}
     */
    async detect(message) {
        /** @type {import('discord.js').Collection<string, import('discord.js').Attachment>} */
        const images = message.attachments.filter(attachment => attachment.contentType.startsWith('image/'));
        if (!images.size) {
            return null;
        }

        let maxType = null, maxValue = null;
        for (const image of images.values()) {
            const safeSearchAnnotation = await this.request(image);
            if (!safeSearchAnnotation) {
                continue;
            }

            for (const type of ['adult', 'medical', 'violence', 'racy']) {
                const likelihood = this.getLikelihoodAsNumber(safeSearchAnnotation[type]);
                if (!maxValue || likelihood > maxValue) {
                    maxType = type;
                    maxValue = likelihood;
                }
            }
        }
        return maxType ? {type: maxType, value: maxValue} : null;
    }


    /**
     * @param {import('discord.js').Attachment} image
     * @return {Promise<google.cloud.vision.v1.ISafeSearchAnnotation>}
     */
    async request(image) {
        const hash = await new Request(image.proxyURL).getHash();

        const cached = this.#cache.get(hash) ?? await this.#getFromDatabase(hash);
        if (cached) {
            return cached;
        }

        const [{safeSearchAnnotation}] = await this.annotatorClient.safeSearchDetection(image.url);
        if (safeSearchAnnotation) {
            this.#cache.set(hash, safeSearchAnnotation, CACHE_DURATION);
            await database.query('INSERT INTO safeSearch (hash, data) VALUES (?, ?)', hash, JSON.stringify(safeSearchAnnotation));
        }
        return safeSearchAnnotation;
    }

    /**
     * @param {string} hash
     * @return {Promise<google.cloud.vision.v1.ISafeSearchAnnotation>}
     */
    async #getFromDatabase(hash) {
        const result = await database.query('SELECT data FROM safeSearch WHERE hash = ?', hash);
        if (!result) {
            return null;
        }
        return JSON.parse(result.data);
    }

    /**
     * convert a likelihood to a number for easy comparison
     * @param {string} likelihood
     * @return {number}
     */
    getLikelihoodAsNumber(likelihood) {
        switch (likelihood) {
            case 'VERY_UNLIKELY':
                return -2;
            case 'UNLIKELY':
                return -1;
            case 'POSSIBLE':
                return 0;
            case 'LIKELY':
                return 1;
            case 'VERY_LIKELY':
                return 2;
            default:
                return -3;
        }
    }
}