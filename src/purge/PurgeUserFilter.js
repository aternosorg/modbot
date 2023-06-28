import PurgeFilter from './PurgeFilter.js';

/**
 * @class PurgeUserFilter
 * @classdesc A filter that matches messages sent by a user
 */
export class PurgeUserFilter extends PurgeFilter {
    /**
     * @param {import('discord.js').User} user
     */
    constructor(user) {
        super();
        this.user = user;
    }

    matches(message) {
        return message.author.id === this.user.id;
    }
}