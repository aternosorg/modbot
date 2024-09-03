import EventListener from '../../EventListener.js';

export default class InteractionCreateEventListener extends EventListener {
    get name() {
        return 'interactionCreate';
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<unknown>}
     * @abstract
     */
    async execute(interaction) {

    }
}