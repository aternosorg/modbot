import {ButtonBuilder} from 'discord.js';

export default class BetterButtonBuilder extends ButtonBuilder {
    /**
     * Set the emoji for this button.
     * If the emoji parameter is null, don't change the emoji.
     * @param {?import('discord.js').ComponentEmojiResolvable} emoji
     * @returns {ButtonBuilder|BetterButtonBuilder}
     */
    setEmojiIfPresent(emoji) {
        if (!emoji) {
            return this;
        }

        return super.setEmoji(emoji);
    }
}