import UnbanInterval from './UnbanInterval.js';
import Logger from '../logging/Logger.js';

export default class IntervalManager {
    /**
     * @type {Interval[]}
     */
    #intervals = [
        new UnbanInterval()
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
                await Logger.instance
                    .error({
                        message: `Failed to run interval '${interval.constructor.name}'`,
                        error: Logger.instance.getData(error)
                    });
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}