import EventListener from '../EventListener.js';
import Logger from '../../Logger.js';

export default class WarnEventListener extends EventListener {
    get name() {
        return 'warn';
    }

    /**
     * @param {string} warning
     * @return {Promise<void>}
     */
    async execute(warning) {
        await Logger.instance.warn({
            message: 'The discord client emitted a warning',
            warning
        });
    }
}