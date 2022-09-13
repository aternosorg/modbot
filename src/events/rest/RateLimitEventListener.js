import EventListener from '../EventListener.js';
import Logger from '../../logging/Logger.js';

export default class RateLimitEventListener extends EventListener {

    async execute(details) {
        await Logger.instance.warn({
            message: 'The bot hit a ratelimit',
            details
        });
    }

    get name() {
        return 'rateLimit';
    }
}