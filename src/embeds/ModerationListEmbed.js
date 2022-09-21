import colors from '../util/colors.js';
import LineEmbed from './LineEmbed.js';

export default class ModerationListEmbed extends LineEmbed {
    /**
     * @param {import('discord.js').User} user
     */
    constructor(user) {
        super();
        this.setColor(colors.ORANGE)
            .setAuthor({
                name: `Moderations for ${user.tag}`,
                iconURL: user.avatarURL()
            });
    }
}