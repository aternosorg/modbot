/**
 * @class
 * @classdesc a task that's run repeatedly
 * @abstract
 */
export default class Interval {
    /**
     * @abstract
     * @returns {number} timeout in ms
     */
    getInterval() {
        return 1000;
    }

    /**
     * run the task
     * @abstract
     * @returns {Promise<void>}
     */
    async run() {

    }
}