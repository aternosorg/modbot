import InteractionCreateEventListener from './InteractionCreateEventListener.js';
import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    UserContextMenuCommandInteraction
} from 'discord.js';
import CommandManager from '../../../commands/CommandManager.js';

export default class CommandEventListener extends InteractionCreateEventListener {
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
        else if (interaction instanceof SelectMenuInteraction) {
            await CommandManager.instance.executeSelectMenu(interaction);
        }
    }
}