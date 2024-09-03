import UnbanInterval from './UnbanInterval.js';
import logger from '../bot/Logger.js';
import UnmuteInterval from './UnmuteInterval.js';
import TransferMuteToTimeoutInterval from './TransferMuteToTimeoutInterval.js';
import CleanupConfirmationInterval from './CleanupConfirmationInterval.js';

export default class IntervalManager {
    /**
     * @type {import('Interval.js')[]}
     */
    #intervals = [
        new UnbanInterval(),
        new UnmuteInterval(),
        new TransferMuteToTimeoutInterval(),
        new CleanupConfirmationInterval(),
    ];

    schedule() {
        for (const interval of this.#intervals) {
            setInterval(this.runInterval, interval.getInterval(), interval);
        }
    }

    /**
     * @param {import('Interval.js')} interval
     */
    async runInterval(interval) {
        try {
            await interval.run();
        }
        catch(error) {
            try {
                await logger.error(`Failed to run interval '${interval.constructor.name}'`, error);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}