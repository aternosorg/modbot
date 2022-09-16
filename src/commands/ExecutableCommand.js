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
     * Permissions that members need to execute this command by default.
     * Null: no permissions required. Empty bitfield: disabled by default
     *
     * This is not checked by ModBot and is only used to register commands on discord
     * @return {?import('discord.js').PermissionsBitField}
     */
    getDefaultMemberPermissions() {
        return null;
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
     * execute a slash command
     * @abstract
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @return {Promise<void>}
     */
    async execute(interaction) {

    }
}