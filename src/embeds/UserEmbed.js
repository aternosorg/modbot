import LineEmbed from './LineEmbed.js';

export default class UserEmbed extends LineEmbed {
    /**
     *
     * @param {import('discord.js').User} user
     */
    constructor(user) {
        super();
        this.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() });
    }
}