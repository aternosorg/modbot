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
     */
    async check() {
        return false;
    }

    /**
     * Run the migration
     * @returns {Promise<void>}
     */
    async run() {
        throw new Error('Migration not implemented');
    }
}