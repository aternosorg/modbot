import {ActionRowBuilder} from 'discord.js';

export default class SimpleActionRow extends ActionRowBuilder {
    /**
     * @param {*} input
     */
    constructor(input) {
        super();
        this.addComponents(input);
    }
}
