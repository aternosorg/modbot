import KeyValueEmbed from './KeyValueEmbed.js';

export default class UserEmbed extends KeyValueEmbed {
    /**
     *
     * @param {import('discord.js').User} user
     */
    constructor(user) {
        super();
        this.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() });
    }
}