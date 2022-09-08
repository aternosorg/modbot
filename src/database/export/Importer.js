export default class Importer {

    /**
     * import all data to the DB
     * @return {Promise<void>}
     */
    async import() {
        throw new Error('Method not implemented');
    }

    /**
     * verify that all data is of correct types before importing
     * @throws {TypeError}
     */
    checkAllTypes() {
        throw new Error('Method not implemented');
    }

    /**
     * generate an embed showing an overview of imported data
     * @return {import('discord.js').EmbedBuilder}
     */
    generateEmbed() {

    }
}
