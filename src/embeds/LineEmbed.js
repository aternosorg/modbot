import EmbedWrapper from './EmbedWrapper.js';
import {EMBED_DESCRIPTION_LIMIT} from '../util/apiLimits.js';

export default class LineEmbed extends EmbedWrapper {
    #lines = [];


    #buildLines() {
        const lastLine = this.#lines.findIndex((_, index, array) =>
            array.slice(0, index + 1).join('\n').length > EMBED_DESCRIPTION_LIMIT);

        this.setDescription(this.#lines
            .slice(0, Math.max(lastLine, 1))
            .join('\n')
            .substring(0, EMBED_DESCRIPTION_LIMIT));
    }

    /**
     * add a line
     * @param {string} content
     * @return {this}
     */
    addLine(content) {
        this.#lines.push(content);
        this.#buildLines();
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

    getLineCount() {
        return this.#lines.length;
    }
}