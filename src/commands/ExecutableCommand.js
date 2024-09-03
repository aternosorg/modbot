import {PermissionsBitField} from 'discord.js';

export default class ExecutableCommand {

    /**
     * @abstract
     * @returns {string}
     */
    getName() {
        return 'unknown';
    }

    /**
     * @abstract
     * @returns {string}
     */
    getDescription() {
        return 'unknown';
    }

    /**
     * get command cool down in seconds
     * @returns {number}
     */
    getCoolDown() {
        return 0;
    }

    /**
     * is this command available in direct messages
     * @returns {boolean}
     */
    isAvailableInDMs() {
        return false;
    }

    /**
     * @returns {import('discord.js').PermissionsBitField}
     */
    getRequiredBotPermissions() {
        return new PermissionsBitField();
    }

    buildOptions(builder) {
        return builder;
    }

    /**
     * @param {import('discord.js').AutocompleteInteraction} interaction
     * @returns {Promise<import('discord.js').ApplicationCommandOptionChoiceData[]>}
     */
    async complete(interaction) {
        return [];
    }

    /**
     * execute a slash command
     * @abstract
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {

    }

    /**
     * handle a button press
     * @param {import('discord.js').ButtonInteraction} interaction
     * @returns {Promise<void>}
     */
    async executeButton(interaction) {

    }

    /**
     * handle data submitted from a modal
     * @param {import('discord.js').ModalSubmitInteraction} interaction
     * @returns {Promise<void>}
     */
    async executeModal(interaction) {

    }

    /**
     * handle data submitted from a modal
     * @param {import('discord.js').AnySelectMenuInteraction} interaction
     * @returns {Promise<void>}
     */
    async executeSelectMenu(interaction) {

    }
}