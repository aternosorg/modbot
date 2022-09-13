import EventListener from '../../EventListener.js';
import CommandManager from '../../../commands/CommandManager.js';

export default class InteractionCreateEventListener extends EventListener {
    get name() {
        return 'interactionCreate';
    }

    /**
     * @param {import('discord.js').BaseInteraction} interaction
     * @return {Promise<unknown>}
     */
    async execute(interaction) {
        await CommandManager.instance.execute(interaction);
    }
}