import {inlineCode} from 'discord.js';

/**
 * @abstract
 */
export default class Trigger {
    /**
     * @type {string}
     */
    type;

    /**
     * @type {string}
     */
    content;

    /**
     * @type {string}
     */
    flags;

    /**
     * @param {object} data
     * @property {string} type
     * @property {string} content
     * @property {string} [flags]
     */
    constructor(data) {
        this.type = data.type;
        this.content = data.content;
        this.flags = data.flags;
    }

    /**
     * @returns {string}
     */
    asString() {
        return `${this.type}: ${inlineCode(this.asContentString())}`;
    }

    /**
     * @returns {string}
     */
    asContentString() {
        return this.content;
    }

    /**
     * Convert this trigger to a regex trigger.
     * This is only supported for include and match types.
     * @returns {Trigger}
     * @abstract
     */
    toRegex() {
        throw new Error('Not implemented');
    }

    /**
     * @param {string} content
     * @returns {boolean}
     * @abstract
     */
    test(content) {
        throw new Error('Not implemented');
    }

    /**
     * @returns {boolean}
     */
    supportsImages() {
        return false;
    }
}