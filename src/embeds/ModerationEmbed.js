import {time, TimestampStyles} from 'discord.js';
import {resolveColor} from '../util/colors.js';
import {formatTime} from '../util/timeutils.js';
import LineEmbed from './LineEmbed.js';

export default class ModerationEmbed extends LineEmbed {

    /**
     * @param {Moderation} moderation
     * @param {import('discord.js').User} user
     */
    constructor(moderation, user) {
        super();
        this.setTitle(`Moderation #${moderation.id} | ${moderation.action.toUpperCase()}`)
            .setColor(resolveColor(moderation.action))
            .setFooter({text: `${user.tag} - ${moderation.userid}`, iconURL: user.avatarURL()});

        this.addLine('Created at',  time(moderation.created, TimestampStyles.LongDate));
        if (moderation.action === 'strike') {
            this.addLine('Strikes', moderation.value);
        } else if (moderation.action === 'pardon') {
            this.addLine('Pardoned Strikes', -moderation.value);
        }

        if (moderation.expireTime) {
            this.addLine('Duration', formatTime(moderation.expireTime - moderation.created));
            this.addLine('Expires', time(moderation.expireTime, TimestampStyles.LongDate));
        }

        if (moderation.moderator) {
            this.addLine('Moderator', `<@!${moderation.moderator}>`);
        }

        this.addLine('Reason', moderation.reason);
    }
}
