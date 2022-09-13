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
     * @return {Promise<void>}
     */
    async notifyEventListener(eventListener) {
        try {
            await eventListener.execute();
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