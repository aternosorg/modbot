import EventListener from '../EventListener.js';
import logger from '../../bot/Logger.js';

export default class WarnEventListener extends EventListener {
    get name() {
        return 'warn';
    }

    /**
     * @param {string} warning
     * @returns {Promise<void>}
     */
    async execute(warning) {
        await logger.warn({
            message: 'The discord client emitted a warning',
            warning
        });
    }
}