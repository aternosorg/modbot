import MessageCreateEventListener from './MessageCreateEventListener.js';
import autoModManager from '../../../automod/AutoModManager.js';

export default class AutoModEventListener extends MessageCreateEventListener {
    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async execute(message) {
        await autoModManager.checkMessage(message);
    }
}