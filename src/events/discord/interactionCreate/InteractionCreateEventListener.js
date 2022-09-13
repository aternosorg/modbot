import EventListener from '../../EventListener.js';

export default class InteractionCreateEventListener extends EventListener {
    get name() {
        return 'interactionCreate';
    }

    /**
     * @abstract
     * @param {import('discord.js').BaseInteraction} interaction
     * @return {Promise<unknown>}
     */
    async execute(interaction) {
        interaction.createdAt;
    }
}