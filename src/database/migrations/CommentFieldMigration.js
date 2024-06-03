import Migration from './Migration.js';

export default class CommentFieldMigration extends Migration {
    async check() {
        /**
         * @type {{Field: string, Type: string, Key: string, Default, Extra: string}[]}
         */
        const columns = await this.database.queryAll('DESCRIBE `moderations`');
        return !columns.some(column => column.Field === 'comment');
    }

    async run() {
        await this.database.query('ALTER TABLE `moderations` ADD COLUMN `comment` TEXT NULL DEFAULT NULL AFTER `reason`');
    }
}