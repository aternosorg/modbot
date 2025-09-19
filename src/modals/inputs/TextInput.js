import {TextInputBuilder} from 'discord.js';
import SimpleActionRow from '../rows/SimpleActionRow.js';

export default class TextInput extends TextInputBuilder {
    /**
     * Create a new action row with this input
     * @returns {import('discord.js').ActionRowBuilder}
     */
    toActionRow() {
        return new SimpleActionRow(this);
    }
}
