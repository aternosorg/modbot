import {inlineCode} from 'discord.js';

/**
 * @abstract
 */
export default class Trigger {
    /**
     * @type {String}
     */
    type;

    /**
     * @type {String}
     */
    content;

    /**
     * @type {String}
     */
    flags;

    /**
     * @param {Object} data
     * @property {String} type
     * @property {String} content
     * @property {String} [flags]
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
     * @return {string}
     */
    asContentString() {
        return this.content;
    }

    /**
     * Convert this trigger to a regex trigger.
     * This is only supported for include and match types.
     * @return {Trigger}
     * @abstract
     */
    toRegex() {
        throw new Error('Not implemented');
    }

    /**
     * @param {String} content
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