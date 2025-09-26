import {ActionRowBuilder} from 'discord.js';

export default class SimpleActionRow extends ActionRowBuilder {
    /**
     * @param {import('discord.js').RestOrArray<import('discord.js').AnyComponentBuilder>} input
     */
    constructor(input) {
        super();
        this.addComponents(input);
    }
}
