import bot from '../../bot/Bot.js';
import EventManager from '../EventManager.js';
import RateLimitEventListener from './RateLimitEventListener.js';

export default class RestEventManagerEventManager extends EventManager {
    subscribe() {
        const rest = bot.client.rest;
        for (const eventListener of this.getEventListeners()) {
            rest.on(eventListener.name, this.notifyEventListener.bind(this, eventListener));
        }
    }

    getEventListeners() {
        return [
            new RateLimitEventListener(),
        ];
    }
}