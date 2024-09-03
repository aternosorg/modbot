/**
 * @import Database from '../bot/Database'
 */

/**
 * @class Migration
 * @classdesc Base class for all migrations
 * @abstract
 */
export default class Migration {
    /**
     * @param {Database} database
     */
    constructor(database) {
        this.database = database;
    }


    /**
     * Does the migration need to run?
     * @returns {Promise<boolean>}
     * @abstract
     */
    async check() {
        return false;
    }

    /**
     * Run the migration
     * @returns {Promise<void>}
     * @abstract
     */
    async run() {
        throw new Error('Migration not implemented');
    }
}