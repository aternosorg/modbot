/**
 * @class Importer
 * @classdesc Base class for importing data into the DB
 * @abstract
 */
export default class Importer {

    /**
     * import all data to the DB
     * @returns {Promise<void>}
     * @abstract
     */
    async import() {
        throw new Error('Method not implemented');
    }

    /**
     * verify that all data is of correct types before importing
     * @throws {TypeError}
     * @abstract
     */
    checkAllTypes() {
        throw new Error('Method not implemented');
    }

    /**
     * generate an embed showing an overview of imported data
     * @returns {import('discord.js').EmbedBuilder}
     * @abstract
     */
    generateEmbed() {
        throw new Error('Method not implemented');
    }
}
