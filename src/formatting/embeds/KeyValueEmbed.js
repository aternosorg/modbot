import {bold} from 'discord.js';
import LineEmbed from './LineEmbed.js';

/**
 * @import {Iterable} from '@types/node';
 */

export default class KeyValueEmbed extends LineEmbed {
    /**
     * add a line
     * @param {string} name
     * @param {string|number} value
     * @returns {this}
     */
    addPair(name, value) {
        return this.addLine(bold(name) + ': ' + value);
    }

    /**
     * add a list of values
     * @param {string} name
     * @param {Iterable<string|number>} list
     * @returns {KeyValueEmbed}
     */
    addList(name, list) {
        this.addLine(bold(name) + ':');
        for (const item of list) {
            this.addLine('- ' + item);
        }
        return this;
    }

    /**
     * add a list of values or a short enumeration for lists with up to 3 items
     * @param {string} name
     * @param {Array<string|number>} list
     * @returns {KeyValueEmbed}
     */
    addListOrShortList(name, list) {
        if (list.length > 3) {
            return this.addList(name, list);
        }
        return this.addPair(name, list.join(', '));
    }

    /**
     * @param {*} condition
     * @param {string} name
     * @param {string|number} value
     * @returns {this}
     */
    addPairIf(condition, name, value) {
        if (condition) {
            this.addPair(name, value);
        }
        return this;
    }

    /**
     * Add a field - but don't be stupid about types
     * @param {string} name
     * @param {string} value
     * @param {boolean} inline
     * @returns {KeyValueEmbed}
     */
    addField(name, value, inline = false) {
        return this.addFields(/** @type {*} */ {name, value, inline});
    }

    /**
     * Add a field if a condition is met
     * @param {*} condition
     * @param {string} name
     * @param {string} value
     * @param {boolean} inline
     * @returns {KeyValueEmbed}
     */
    addFieldIf(condition, name, value, inline = false) {
        if (condition) {
            this.addField(name, value, inline);
        }
        return this;
    }
}