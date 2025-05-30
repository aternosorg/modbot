import Migration from './Migration.js';

/**
 * @import Database from '../bot/Database'
 */

/**
 * A migration that creates an index.
 */
export default class IndexMigration extends Migration {
    #table;
    #indexName;
    #columns;

    /**
     * @param {Database} database
     * @param {string} table name of the table to create the index on
     * @param {string} indexName name of the index to create
     * @param {string[]} columns list of columns to include in the index
     */
    constructor(database, table, indexName, columns) {
        super(database);
        this.#table = table;
        this.#indexName = indexName;
        this.#columns = columns;
    }


    async check() {
        let res = await this.database.query(`
SELECT 
    COUNT(1) indexExists
FROM
    INFORMATION_SCHEMA.STATISTICS
WHERE
    table_schema = DATABASE()
  AND
    table_name = ?
  AND
    index_name = ?;
`, this.#table, this.#indexName);

        return res.indexExists === "0";
    }

    async run() {
        await this.database.query(`CREATE INDEX ${this.database.escapeId(this.#indexName)}
ON ${this.database.escapeId(this.#table)} (${this.#columns.map(c => this.database.escapeId(c)).join(`, `)})`);
    }
}
