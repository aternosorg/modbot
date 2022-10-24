import EventListener from '../EventListener.js';
import logger from '../../bot/Logger.js';

export default class RateLimitEventListener extends EventListener {

    async execute(details) {
        await logger.warn({
            message: 'The bot hit a ratelimit',
            details
        });
    }

    get name() {
        return 'rateLimited';
    }
}