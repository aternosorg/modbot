import EventListener from '../EventListener.js';
import Logger from '../../Logger.js';

export default class ErrorEventListener extends EventListener {
    get name() {
        return 'error';
    }

    /**
     * @param {Error} error
     * @return {Promise<void>}
     */
    async execute(error) {
        await Logger.instance.error('The discord client experienced an error', error);
    }
}