import MessageUpdateEventListener from './MessageUpdateEventListener.js';
import autoModManager from '../../../automod/AutoModManager.js';

export default class AutoModMessageEditEventListener extends MessageUpdateEventListener {

    async execute(oldMessage, message) {
        await autoModManager.checkMessageEdit(message);
    }
}