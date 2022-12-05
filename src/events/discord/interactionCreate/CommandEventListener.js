import InteractionCreateEventListener from './InteractionCreateEventListener.js';
import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction
} from 'discord.js';
import commandManager from '../../../commands/CommandManager.js';

export default class CommandEventListener extends InteractionCreateEventListener {
    async execute(interaction) {
        if (interaction instanceof ChatInputCommandInteraction) {
            await commandManager.execute(interaction);
        }
        else if (interaction instanceof AutocompleteInteraction) {
            await commandManager.autocomplete(interaction);
        }
        else if (interaction instanceof UserContextMenuCommandInteraction) {
            await commandManager.executeUserMenu(interaction);
        }
        else if (interaction instanceof MessageContextMenuCommandInteraction) {
            await commandManager.executeMessageMenu(interaction);
        }
        else if (interaction instanceof ButtonInteraction) {
            await commandManager.executeButton(interaction);
        }
        else if (interaction instanceof ModalSubmitInteraction) {
            await commandManager.executeModal(interaction);
        }
        else if (interaction.isAnySelectMenu()) {
            await commandManager.executeSelectMenu(/** @type {import('discord.js').AnySelectMenuInteraction} */interaction);
        }
    }
}