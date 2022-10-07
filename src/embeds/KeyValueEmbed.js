import {bold} from 'discord.js';
import LineEmbed from './LineEmbed.js';

export default class KeyValueEmbed extends LineEmbed {
    /**
     * add a line
     * @param {string} name
     * @param {string|number} value
     * @return {this}
     */
    addPair(name, value) {
        return this.addLine(bold(name) + ': ' + value);
    }

    /**
     * @param {*} condition
     * @param {string} name
     * @param {string|number} value
     * @return {this}
     */
    addPairIf(condition, name, value) {
        if (condition) {
            this.addPair(name, value);
        }
        return this;
    }
}