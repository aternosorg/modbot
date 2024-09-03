import EventListener from '../../EventListener.js';

export default class MessageUpdateEventListener extends EventListener {

    /**
     * @abstract
     * @param {import('discord.js').Message} oldMessage
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async execute(oldMessage, message) {
        return Promise.resolve(undefined);
    }

    get name() {
        return 'messageUpdate';
    }
}