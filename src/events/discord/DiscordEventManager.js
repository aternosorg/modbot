import Bot from '../../bot/Bot.js';
import ErrorEventListener from './ErrorEventListener.js';
import BanRemoveEventListener from './BanRemoveEventListener.js';
import GuildDeleteEventListener from './GuildDeleteEventListener.js';
import LogJoinEventListener from './guildMemberAdd/LogJoinEventListener.js';
import RaidModeEventListener from './guildMemberAdd/RaidModeEventListener.js';
import RestoreMutedRoleEventListener from './guildMemberAdd/RestoreMutedRoleEventListener.js';
import GuildMemberRemoveEventListener from './GuildMemberRemoveEventListener.js';
import AutoModEventListener from './messageCreate/AutoModEventListener.js';
import AutoResponseEventListener from './messageCreate/AutoResponseEventListener.js';
import EventManager from '../EventManager.js';
import MessageDeleteEventListener from './MessageDeleteEventListener.js';
import MessageDeleteBulkEventListener from './MessageDeleteBulkEventListener.js';

export default class DiscordEventManager extends EventManager {

    subscribe() {
        const client = Bot.instance.client;
        for (const eventListener of this.getEventListeners()) {
            client.on(eventListener.name, this.notifyEventListener.bind(this, eventListener));
        }
    }

    getEventListeners() {
        return [
            new ErrorEventListener(),
            new BanRemoveEventListener(),
            new GuildDeleteEventListener(),
            new GuildMemberRemoveEventListener(),

            // members
            // join
            new LogJoinEventListener(),
            new RaidModeEventListener(),
            new RestoreMutedRoleEventListener(),

            // messages
            new AutoModEventListener(),
            new AutoResponseEventListener(),
            new MessageDeleteEventListener(),
            new MessageDeleteBulkEventListener(),
        ];
    }
}