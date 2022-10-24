import EmbedWrapper from './EmbedWrapper.js';
import {EMBED_DESCRIPTION_LIMIT} from '../util/apiLimits.js';

export default class LineEmbed extends EmbedWrapper {
    #lines = [];


    #buildLines() {
        let content = '';

        for (const line of this.#lines) {
            let newContent = content + line + '\n';
            if (newContent.length <= EMBED_DESCRIPTION_LIMIT) {
                content = newContent;
            }
            else {
                break;
            }
        }

        this.setDescription(content);
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