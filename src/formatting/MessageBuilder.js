import {
    bold,
    heading,
    HeadingLevel,
    italic,
    strikethrough,
    hyperlink,
    underline,
    ContainerBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder, subtext,
} from 'discord.js';
import {inlineEmojiIfExists} from '../util/format.js';

export default class MessageBuilder {
    /**
     * @type {ContainerBuilder}
     */
    #container = new ContainerBuilder();

    /**
     * @type {string}
     */
    #content = '';

    /**
     * Add a new line to the content.
     * @param {string} content
     * @returns {MessageBuilder}
     */
    text(content) {
        this.#content += content;
        return this;
    }

    /**
     * Add a space to the content.
     * @returns {MessageBuilder}
     */
    space() {
        return this.text(' ');
    }

    /**
     * Add a period to the content.
     * @returns {MessageBuilder}
     */
    period() {
        return this.text('.');
    }

    /**
     * Add specified number of line breaks to the content
     * @param {number} count number of line breaks to append
     * @returns {MessageBuilder}
     */
    newLine(count = 1) {
        return this.text('\n'.repeat(count));
    }

    /**
     * Add bold text to the content.
     * @param {string} content
     * @returns {MessageBuilder}
     */
    bold(content) {
        return this.text(bold(content));
    }

    /**
     * Add italic text to the content.
     * @param {string} content
     * @returns {MessageBuilder}
     */
    italic(content) {
        return this.text(italic(content));
    }

    /**
     * Add underlined content to the content.
     * @param {string} content
     * @returns {MessageBuilder}
     */
    underline(content) {
        return this.text(underline(content));
    }

    /**
     * Add strikethrough content to the content.
     * @param {string} content
     * @returns {MessageBuilder}
     */
    strike(content) {
        return this.text(strikethrough(content));
    }

    /**
     * Add a hyperlink to the content.
     * @param {string} content
     * @param {string} url
     * @param {string} [title]
     * @returns {MessageBuilder}
     */
    link(content, url, title) {
        return this.text(hyperlink(content, url, title));
    }

    /**
     * Add a heading to the content.
     * @param {string} content
     * @param {number} level
     * @param {boolean} newline
     * @returns {MessageBuilder}
     */
    heading(content, level = HeadingLevel.One, newline = true) {
        // noinspection JSCheckFunctionSignatures
        this.text(heading(content, level));

        if (newline) {
            this.newLine();
        }

        return this;
    }

    /**
     * Add subtext to the content.
     * @param {string} content
     * @returns {MessageBuilder}
     */
    subtext(content) {
        return this.text(subtext(content));
    }

    /**
     * Add items as a list
     * @param {string} items
     * @returns {MessageBuilder}
     */
    list(...items) {
        return this.text(items.map(s => '- ' + s).join('\n'));
    }

    /**
     * Add items as a list or a fallback value if no items are provided
     * @param {string} fallback
     * @param {string} items
     * @returns {MessageBuilder}
     */
    listOr(fallback, ...items) {
        if (items.length === 0) {
            return this.text(fallback);
        }
        return this.list(...items);
    }

    /**
     * Create a list of items using emojis. If the emojis are not present, the items will be displayed as a normal list.
     * @param {string} items emoji name (from the config) followed by the list item
     * @returns {MessageBuilder}
     */
    emojiList(...items) {
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
        return this.text(lines.join('\n'));
    }


    /**
     * Add a key-value pair to the content
     * @param {string} key
     * @param {string} value
     * @returns {MessageBuilder}
     */
    pair(key, value) {
        return this.bold(key)
            .text(':')
            .space()
            .text(value)
            .newLine();
    }

    /**
     * Add a key-value pair to the content if the condition is met
     * @param {unknown} condition
     * @param {string} key
     * @param {string} value
     * @returns {MessageBuilder}
     */
    pairIf(condition, key, value) {
        if (condition) {
            return this.pair(key, value);
        }
        return this;
    }

    /**
     * End the current text component and return the container
     * @returns {ContainerBuilder}
     */
    endComponent() {
        if (this.#content) {
            this.#container.addTextDisplayComponents(new TextDisplayBuilder().setContent(this.#content));
            this.#content = '';
        }
        return this.#container;
    }

    /**
     * @param {boolean} divider
     * @param {SeparatorSpacingSize} spacing
     * @returns {MessageBuilder}
     */
    separator(divider = true, spacing = SeparatorSpacingSize.Small) {
        this.endComponent().addSeparatorComponents(new SeparatorBuilder().setDivider(divider).setSpacing(spacing));
        return this;
    }

    /**
     * @param {import('discord.js').ButtonBuilder} builder
     * @returns {MessageBuilder}
     */
    button(...builder) {
        this.endComponent().addActionRowComponents(new ActionRowBuilder().addComponents(...builder));
        return this;
    }

    /**
     * @param {import('discord.js').SelectMenuBuilder} builder
     * @returns {MessageBuilder}
     */
    select(...builder) {
        this.endComponent().addActionRowComponents(new ActionRowBuilder().addComponents(...builder));
        return this;
    }

    /**
     * @param {import('discord.js').MediaGalleryItemBuilder} builder
     * @returns {MessageBuilder}
     */
    image(...builder) {
        this.endComponent().addMediaGalleryComponents(new MediaGalleryBuilder().addItems(...builder));
        return this;
    }
}
