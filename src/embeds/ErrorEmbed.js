import EmbedWrapper from './EmbedWrapper.js';
import colors from '../util/colors.js';

export default class ErrorEmbed extends EmbedWrapper {
    /**
     * @param {string} description
     */
    constructor(description) {
        super();
        this.setDescription(description);
        this.setColor(colors.RED);
    }

    /**
     * @param {string} description
     * @returns {{embeds: EmbedWrapper[]}}
     */
    static message(description) {
        return new this(description).toMessage();
    }
}