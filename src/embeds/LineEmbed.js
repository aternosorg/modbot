import {bold, EmbedBuilder} from 'discord.js';
import {EMBED_DESCRIPTION_LIMIT} from '../util/apiLimits.js';

export default class LineEmbed extends EmbedBuilder {
    #lines = [];

    /**
     * add a line
     * @param {string} name
     * @param {string|number} value
     * @return {this}
     */
    addLine(name, value) {
        this.#lines.push(bold(name) + ': ' + value);
        this.setDescription(this.#lines.join('\n').substring(0, EMBED_DESCRIPTION_LIMIT));
        return this;
    }

    /**
     * @param {*} condition
     * @param {string} name
     * @param {string|number} value
     * @return {this}
     */
    addLineIf(condition, name, value) {
        if (condition) {
            this.addLine(name, value);
        }
        return this;
    }

    /**
     * add an empty line
     * @return {this}
     */
    newLine() {
        this.#lines.push('');
        return this;
    }
}