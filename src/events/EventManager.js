import Bot from '../bot/Bot.js';
import ErrorEventListener from './ErrorEventListener.js';
import Logger from '../logging/Logger.js';
import BanRemoveEventListener from './BanRemoveEventListener.js';
import GuildDeleteEventListener from './GuildDeleteEventListener.js';
import LogJoinEventListener from './guildMemberAdd/LogJoinEventListener.js';
import RaidModeEventListener from './guildMemberAdd/RaidModeEventListener.js';
import RestoreMutedRoleEventListener from './guildMemberAdd/RestoreMutedRoleEventListener.js';
import GuildMemberRemoveEventListener from './GuildMemberRemoveEventListener.js';

export default class EventManager {
    /**
     * @type {EventListener[]}
     */
    #eventListeners = [
        new ErrorEventListener(),
        new BanRemoveEventListener(),
        new GuildDeleteEventListener(),
        new GuildMemberRemoveEventListener(),

        // new members
        new LogJoinEventListener(),
        new RaidModeEventListener(),
        new RestoreMutedRoleEventListener(),
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