import bot from '../../bot/Bot.js';
import ErrorEventListener from './ErrorEventListener.js';
import BanRemoveEventListener from './BanRemoveEventListener.js';
import GuildDeleteEventListener from './GuildDeleteEventListener.js';
import LogJoinEventListener from './guildMemberAdd/LogJoinEventListener.js';
import RestoreMutedRoleEventListener from './guildMemberAdd/RestoreMutedRoleEventListener.js';
import GuildMemberRemoveEventListener from './GuildMemberRemoveEventListener.js';
import AutoModEventListener from './messageCreate/AutoModEventListener.js';
import AutoResponseEventListener from './messageCreate/AutoResponseEventListener.js';
import EventManager from '../EventManager.js';
import MessageDeleteEventListener from './MessageDeleteEventListener.js';
import MessageDeleteBulkEventListener from './MessageDeleteBulkEventListener.js';
import LogMessageUpdateEventListener from './messageUpdate/LogMessageUpdateEventListener.js';
import WarnEventListener from './WarnEventListener.js';
import CommandEventListener from './interactionCreate/CommandEventListener.js';
import DeleteConfirmationEventListener from './interactionCreate/DeleteConfirmationEventListener.js';
import AutoModMessageEditEventListener from './messageUpdate/AutoModMessageEditEventListener.js';
import GuildAuditLogCreateEventListener from './GuildAuditLogCreateEventListener.js';

export default class DiscordEventManager extends EventManager {

    subscribe() {
        const client = bot.client;
        for (const eventListener of this.getEventListeners()) {
            client.on(eventListener.name, this.notifyEventListener.bind(this, eventListener));
        }
    }

    getEventListeners() {
        return [
            new ErrorEventListener(),
            new BanRemoveEventListener(),
            new GuildDeleteEventListener(),
            new WarnEventListener(),
            new GuildAuditLogCreateEventListener(),

            // members
            // join
            new LogJoinEventListener(),
            new RestoreMutedRoleEventListener(),
            // leave
            new GuildMemberRemoveEventListener(),

            // messages
            new AutoModEventListener(),
            new AutoResponseEventListener(),
            new MessageDeleteEventListener(),
            new MessageDeleteBulkEventListener(),
            new LogMessageUpdateEventListener(),
            new AutoModMessageEditEventListener(),

            // interactions
            new CommandEventListener(),
            new DeleteConfirmationEventListener(),
        ];
    }
}