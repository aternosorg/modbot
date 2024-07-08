import config from '../bot/Config.js';
import vision from '@google-cloud/vision';
import logger from '../bot/Logger.js';
import {Collection} from 'discord.js';
import GuildSettings from '../settings/GuildSettings.js';

export class CloudVision {
    #imageAnnotatorClient = null;
    #imageTexts = new Collection();

    get isEnabled() {
        return config.data.googleCloud.vision?.enabled;
    }

    get annotatorClient() {
        if (!this.isEnabled) {
            return null;
        }

        return this.#imageAnnotatorClient ??= new vision.ImageAnnotatorClient({
            credentials: config.data.googleCloud.credentials
        });
    }

    /**
     * Get all image attachments from a message
     * @param {import('discord.js').Message} message
     * @returns {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').Attachment>}
     */
    getImages(message) {
        return message.attachments.filter(attachment => attachment.contentType?.startsWith('image/'));
    }

    /**
     * Get text from images in a message
     * @param {import('discord.js').Message} message
     * @returns {Promise<string[]>}
     */
    async getImageText(message) {
        if (!this.isEnabled) {
            return [];
        }

        const guildSettings = await GuildSettings.get(message.guild.id);
        if (!guildSettings.isFeatureWhitelisted) {
            return [];
        }

        if (this.#imageTexts.has(message.id)) {
            return this.#imageTexts.get(message.id);
        }

        const texts = [];

        for (const image of this.getImages(message).values()) {
            try {
                const [{textAnnotations}] = await this.annotatorClient.textDetection(image.url);
                for (const annotation of textAnnotations) {
                    texts.push(annotation.description);
                }
            }
            catch (error) {
                await logger.error(error);
            }
        }

        if (texts.length) {
            this.#imageTexts.set(message.id, texts);
            setTimeout(() => this.#imageTexts.delete(message.id), 5000);
        }

        return texts;
    }
}

export default new CloudVision();
