/**
 * @class
 * @classdesc a task that's run repeatedly
 * @abstract
 */
export default class Interval {
    /**
     * @abstract
     * @return {number} timeout in ms
     */
    getInterval() {
        return 1000;
    }

    /**
     * run the task
     * @abstract
     * @return {Promise<void>}
     */
    async run() {

    }
}