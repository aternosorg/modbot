/**
 * @class
 * @classdesc a task that's run repeatedly
 * @abstract
 */
export default class EventListener {
    /**
     * get the event name
     * @abstract
     * @returns {string}
     */
    get name() {
        return 'message';
    }

    /**
     * execute this event
     * @abstract
     */
    async execute() {

    }
}