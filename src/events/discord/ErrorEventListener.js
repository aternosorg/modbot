import EventListener from '../EventListener.js';
import logger from '../../bot/Logger.js';

export default class ErrorEventListener extends EventListener {
    get name() {
        return 'error';
    }

    /**
     * @param {Error} error
     * @returns {Promise<void>}
     */
    async execute(error) {
        await logger.error('The discord client experienced an error', error);
    }
}