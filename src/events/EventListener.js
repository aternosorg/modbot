/**
 * @class
 * @classdesc a task that's run repeatedly
 * @abstract
 */
export default class EventListener {
    /**
     * get the event name
     * @abstract
     * @return {string}
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