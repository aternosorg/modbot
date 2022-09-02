import Bot from '../bot/Bot.js';
import ErrorEventListener from './error/ErrorEventListener.js';
import Logger from '../logging/Logger.js';

export default class EventManager {
    /**
     * @type {EventListener[]}
     */
    #eventListeners = [
        new ErrorEventListener(),
    ];

    subscribe() {
        const client = Bot.instance.client;
        for (const eventListener of this.#eventListeners) {
            client.on(eventListener.name, this.notifyEventListener.bind(this, eventListener));
        }
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