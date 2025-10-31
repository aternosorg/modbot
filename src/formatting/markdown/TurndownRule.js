/**
 * @abstract
 */
export default class TurndownRule {
    /**
     * @abstract
     * @type {import('turndown').Filter}
     */
    filter;

    /**
     * @abstract
     * @param {string} content
     * @param {HTMLElement} node
     * @param {import('turndown').TurndownOptions} options
     * @returns {string}
     */
    replacement(content, node, options) {

    }

    /**
     * Removes markdown formatting from text.
     * @param {string} text
     * @returns {string} text without markdown
     */
    removeMarkdown(text) {
        return text.replace(/(?<!\\)[*_~`]+/g, '');
    }

    /**
     * Unescapes markdown formatting in text.
     * @param {string} text
     * @returns {string} text with unescaped markdown
     */
    unescapeMarkdown(text) {
        return text.replace(/\\([*_~`[\]])/g, '$1');
    }
}
