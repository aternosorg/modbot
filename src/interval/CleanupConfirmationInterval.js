import Interval from './Interval.js';
import database from '../bot/Database.js';

export default class CleanupConfirmationInterval extends Interval {

    getInterval() {
        return 5 * 60 * 1000;
    }

    async run() {
        const now = Math.floor(Date.now() / 1000);
        await database.queryAll('DELETE FROM confirmations WHERE expires <= ?', now);
    }
}