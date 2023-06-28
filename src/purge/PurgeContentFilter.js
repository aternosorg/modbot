import PurgeFilter from './PurgeFilter.js';

/**
 * @class PurgeContentFilter
 * @classdesc A filter that matches messages containing a string
 */
export default class PurgeContentFilter extends PurgeFilter {
    /**
     * @param {string} content the content to filter for
     */
    constructor(content) {
        super();
        this.content = content.toLowerCase();
    }

    matches(message) {
        return message.content.includes(this.content);
    }
}