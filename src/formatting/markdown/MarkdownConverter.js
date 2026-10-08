/**
 * @import {MessageBuilder} from './MessageBuilder.js';
 */

import Turndown from 'turndown';
import HeadingsRule from './HeadingRule.js';
import CodeblockRule from './CodeblockRule.js';
import LinkRule from './LinkRule.js';
import UnsupportedContentRule from './UnsupportedContentRule.js';
import RemoveRule from './RemoveRule.js';

/**
 * A utility class for converting HTML to discord markdown.
 */
export default class MarkdownConverter {
    #turndown;

    constructor() {
        this.#turndown = new Turndown({
            bulletListMarker: '-',
            hr: '',
        })
            .addRule('remove', new RemoveRule())
            .addRule('headings', new HeadingsRule())
            .addRule('codeblocks', new CodeblockRule())
            .addRule('links', new LinkRule())
            .addRule('unsupported', new UnsupportedContentRule());
    }

    /**
     * Converts HTML to markdown.
     * @param {string} body HTML body
     * @returns {string}
     */
    generate(body) {
        return this.#turndown.turndown(body)
            .replaceAll(/\n\n+/g, '\n');
    }
}
