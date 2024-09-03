import logger from '../bot/Logger.js';

/**
 * @import {EventListener} from '../../events/EventListener.js';
 */

export default class EventManager {

    /**
     * @abstract
     * @returns {EventListener[]}
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
     * @returns {Promise<void>}
     */
    async notifyEventListener(eventListener, ...args) {
        try {
            await eventListener.execute(...args);
        }
        catch (e) {
            try {
                await logger.error(`Failed to execute event listener '${eventListener.constructor.name}': ${e.name}`, e);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}