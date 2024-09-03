import EventListener from '../../EventListener.js';

export default class MessageCreateEventListener extends EventListener {

    get name() {
        return 'messageCreate';
    }

    /**
     * @abstract
     * @param {import('discord.js').Message} message
     * @returns {Promise<unknown>}
     */
    async execute(message) {
        message.createdAt;
    }
}