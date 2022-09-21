import UnbanInterval from './UnbanInterval.js';
import Logger from '../Logger.js';
import UnmuteInterval from './UnmuteInterval.js';
import TransferMuteToTimeoutInterval from './TransferMuteToTimeoutInterval.js';

export default class IntervalManager {
    /**
     * @type {Interval[]}
     */
    #intervals = [
        new UnbanInterval(),
        new UnmuteInterval(),
        new TransferMuteToTimeoutInterval(),
    ];

    schedule() {
        for (const interval of this.#intervals) {
            setInterval(this.runInterval, interval.getInterval(), interval);
        }
    }

    /**
     * @param {Interval} interval
     */
    async runInterval(interval) {
        try {
            await interval.run();
        }
        catch(error) {
            try {
                await Logger.instance.error(`Failed to run interval '${interval.constructor.name}'`, error);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}