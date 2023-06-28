import PurgeFilter from './PurgeFilter.js';

/**
 * @class PurgeRegexFilter
 * @classdesc A filter that matches messages matching a regex
 */
export default class PurgeRegexFilter extends PurgeFilter {
    /**
     * @param {RegExp} regex
     */
    constructor(regex) {
        super();
        this.regex = regex;
    }

    matches(message) {
        return this.regex.test(message.content);
    }
}