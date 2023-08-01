import EmbedWrapper from './EmbedWrapper.js';
import {bold, escapeMarkdown, formatEmoji} from 'discord.js';
import {formatTime} from '../util/timeutils.js';

export default class UserActionEmbed extends EmbedWrapper {
    /**
     *
     * @param {import('discord.js').User} user
     * @param {string} reason
     * @param {string} action
     * @param {number} color
     * @param {?string} emoji
     * @param {?number} duration
     */
    constructor(user, reason, action, color, emoji, duration = null) {
        super();
        let description = `${bold(escapeMarkdown(user.displayName))} has been ${action}`;
        if (duration) {
            description += ` for ${formatTime(duration)}`;
        }
        if (emoji) {
            description = formatEmoji(emoji) + ' ' + description;
        }
        description += `: ${reason}`;

        this.setDescription(description);
        this.setColor(color);
    }

}