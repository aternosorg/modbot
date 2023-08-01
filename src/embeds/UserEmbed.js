import KeyValueEmbed from './KeyValueEmbed.js';

export default class UserEmbed extends KeyValueEmbed {
    /**
     *
     * @param {import('discord.js').User|import('discord.js').GuildMember} user
     */
    constructor(user) {
        super();
        this.setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() });
    }
}