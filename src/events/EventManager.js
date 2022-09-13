import Logger from '../logging/Logger.js';

export default class EventManager {

    /**
     * @abstract
     * @return {EventListener[]}
     */
    getEventListeners() {

    }

    /**
     * subscribe to event listeners
     * @abstract
     */
    subscribe() {

    }

    /**
     * @param {EventListener} eventListener
     * @param {*} args
     * @return {Promise<void>}
     */
    async notifyEventListener(eventListener, ...args) {
        try {
            await eventListener.execute(...args);
        }
        catch (e) {
            try {
                await Logger.instance.error(`Failed to execute event listener '${eventListener.constructor.name}'`, e);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}