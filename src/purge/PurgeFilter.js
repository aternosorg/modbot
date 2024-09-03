/**
 * @class PurgeFilter
 * @classdesc Represents a filter for the purge command
 * @abstract
 */
export default class PurgeFilter {

    /**
     * Does this message match this filter?
     * @abstract
     * @param {import('discord.js').Message} message
     * @returns {boolean}
     */
    matches(message) {
        throw new Error('Not implemented');
    }
}