import {PermissionsBitField} from 'discord.js';

export default class ExecutableCommand {

    /**
     * @abstract
     * @return {string}
     */
    getName() {
        return 'unknown';
    }

    /**
     * @abstract
     * @return {string}
     */
    getDescription() {
        return 'unknown';
    }

    /**
     * get command cool down in seconds
     * @return {number}
     */
    getCoolDown() {
        return 0;
    }

    /**
     * is this command available in direct messages
     * @return {boolean}
     */
    isAvailableInDMs() {
        return false;
    }

    /**
     * @return {import('discord.js').PermissionsBitField}
     */
    getRequiredBotPermissions() {
        return new PermissionsBitField();
    }

    buildOptions(builder) {
        return builder;
    }

    /**
     * @param {import('discord.js').AutocompleteInteraction} interaction
     * @return {Promise<import('discord.js').ApplicationCommandOptionChoiceData[]>}
     */
    async complete(interaction) {
        return [];
    }

    /**
     * execute a slash command
     * @abstract
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @return {Promise<void>}
     */
    async execute(interaction) {

    }

    /**
     * handle a button press
     * @param {import('discord.js').ButtonInteraction} interaction
     * @return {Promise<void>}
     */
    async executeButton(interaction) {

    }

    /**
     * handle data submitted from a modal
     * @param {import('discord.js').ModalSubmitInteraction} interaction
     * @return {Promise<void>}
     */
    async executeModal(interaction) {

    }

    /**
     * handle data submitted from a modal
     * @param {import('discord.js').AnySelectMenuInteraction} interaction
     * @return {Promise<void>}
     */
    async executeSelectMenu(interaction) {

    }
}