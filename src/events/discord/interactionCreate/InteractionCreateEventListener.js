import EventListener from '../../EventListener.js';
import CommandManager from '../../../commands/CommandManager.js';
import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction, ModalSubmitInteraction,
    UserContextMenuCommandInteraction
} from 'discord.js';

export default class InteractionCreateEventListener extends EventListener {
    get name() {
        return 'interactionCreate';
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @return {Promise<unknown>}
     */
    async execute(interaction) {
        if (interaction instanceof ChatInputCommandInteraction) {
            await CommandManager.instance.execute(interaction);
        }
        else if (interaction instanceof AutocompleteInteraction) {
            await CommandManager.instance.autocomplete(interaction);
        }
        else if (interaction instanceof UserContextMenuCommandInteraction) {
            await CommandManager.instance.executeUserMenu(interaction);
        }
        else if (interaction instanceof MessageContextMenuCommandInteraction) {
            await CommandManager.instance.executeMessageMenu(interaction);
        }
        else if (interaction instanceof ButtonInteraction) {
            await CommandManager.instance.executeButton(interaction);
        }
        else if (interaction instanceof ModalSubmitInteraction) {
            await CommandManager.instance.executeModal(interaction);
        }
    }
}