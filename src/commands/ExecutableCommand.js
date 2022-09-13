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
     * @return {import('discord.js').PermissionsBitField}
     */
    getRequiredUserPermissions() {
        return new PermissionsBitField();
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
     * @param {import('discord.js').BaseInteraction} interaction
     * @return {Promise<import('discord.js').ApplicationCommandOptionChoiceData[]>}
     */
    async complete(interaction) {
        return [];
    }

    /**
     * @abstract
     * @param {import('discord.js').BaseInteraction} interaction
     * @return {Promise<void>}
     */
    async execute(interaction) {

    }
}