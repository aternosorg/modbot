import {TextInputStyle} from 'discord.js';
import TextInput from './TextInput.js';

export default class ReasonInput extends TextInput {
    constructor() {
        super();
        this.setRequired(false)
            .setLabel('Reason')
            .setCustomId('reason')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('No reason provided');
    }
}
