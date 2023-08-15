import colors from '../util/colors.js';
import KeyValueEmbed from './KeyValueEmbed.js';

export default class ModerationListEmbed extends KeyValueEmbed {
    /**
     * @param {import('discord.js').GuildMember|import('discord.js').User} user
     */
    constructor(user) {
        super();
        this.setColor(colors.ORANGE)
            .setAuthor({
                name: `Moderations for ${user.displayName}`,
                iconURL: user.displayAvatarURL()
            });
    }
}