import {bold, EmbedBuilder} from 'discord.js';

export default class UserEmbed extends EmbedBuilder {
    lines = [];

    /**
     *
     * @param {import('discord.js').User} user
     */
    constructor(user) {
        super();
        this.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() });
    }

    /**
     * add a line
     * @param {string} name
     * @param {string|number} value
     * @return {UserEmbed}
     */
    addLine(name, value) {
        this.lines.push(bold(name) + ': ' + value);
        this.setDescription(this.lines.join('\n'));
        return this;
    }

    /**
     * add an empty line
     * @return {UserEmbed}
     */
    newLine() {
        this.lines.push('');
        return this;
    }
}