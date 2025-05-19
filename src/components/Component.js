import {ActionRowBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder} from 'discord.js';
import {inlineEmojiIfExists} from '../util/format.js';

export default class Component {
    /**
     * @param {string} lines
     * @returns {import('discord.js').TextDisplayBuilder|*}
     */
    static text(...lines) {
        return new TextDisplayBuilder().setContent(lines.join('\n'));
    }

    /**
     * @param {string} content
     * @returns {TextDisplayBuilder|*}
     */
    static h1(content) {
        return this.text('# ' + content);
    }

    /**
     * @param {string} content
     * @returns {TextDisplayBuilder|*}
     */
    static h2(content) {
        return this.text('## ' + content);
    }

    /**
     * @param {string} content
     * @returns {TextDisplayBuilder|*}
     */
    static h3(content) {
        return this.text('### ' + content);
    }

    /**
     * @param {string} items
     * @returns {import('discord.js').TextDisplayBuilder|*}
     */
    static list(...items) {
        return this.text(...items.map(s => '- ' + s));
    }

    /**
     * Create a list of items using emojis. If the emojis are not present, the items will be displayed as a normal list.
     * @param {string} items emoji name (from the config) followed by the list item
     * @returns {import('discord.js').TextDisplayBuilder|*}
     */
    static emojiList(...items) {
        const lines = [];
        for (let i = 0; i + 1 < items.length; i += 2) {
            const emoji = inlineEmojiIfExists(items[i]);
            const item = items[i + 1];
            if (emoji) {
                lines.push(emoji + item);
            } else {
                lines.push('- ' + item);
            }
        }
        return this.text(...lines);
    }

    /**
     * @param {boolean} divider
     * @param {SeparatorSpacingSize} spacing
     * @returns {SeparatorBuilder|*}
     */
    static separator(divider = true, spacing = SeparatorSpacingSize.Small) {
        return new SeparatorBuilder().setDivider(divider).setSpacing(spacing);
    }

    /**
     * @template {import('@discordjs/builders').AnyComponentBuilder} T
     * @param {T} items
     * @returns {ActionRowBuilder<T>|*}
     */
    static actionRow(...items) {
        return new ActionRowBuilder()
            .addComponents(
                ...items
            );
    }
}
