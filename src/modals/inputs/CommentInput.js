import {TextInputStyle} from 'discord.js';
import TextInput from './TextInput.js';

export default class CommentInput extends TextInput {
    constructor() {
        super();
        this.setRequired(false)
            .setLabel('Comment')
            .setCustomId('comment')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('No comment provided');
    }
}
