import Migration from './Migration.js';

export default class DMMigration extends Migration {

    async check() {
        /**
         * @type {{Field: string, Type: string, Key: string, Default, Extra: string}[]}
         */
        const columns = await this.database.queryAll('DESCRIBE `badWords`');
        return !columns.some(column => column.Field === 'dm');
    }

    async run() {
        await this.database.query('ALTER TABLE `badWords` ADD COLUMN `dm` TEXT NULL DEFAULT NULL AFTER `priority`');
    }
}
