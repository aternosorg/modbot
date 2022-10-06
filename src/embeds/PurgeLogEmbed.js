import LineEmbed from './LineEmbed.js';
import colors from '../util/colors.js';
import {channelMention, codeBlock, userMention} from 'discord.js';

export default class PurgeLogEmbed extends LineEmbed {
    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {number} count successfully deleted messages
     * @param {number} limit
     * @param {?import('discord.js').User} [user] targeted user
     * @param {?string} [regex]
     */
    constructor(interaction, count, limit, user = null, regex = null) {
        super();
        this.setColor(colors.RED)
            .setAuthor({name: `${interaction.user.tag} purged ${count} messages`})
            .addLine('Channel', channelMention(interaction.channel.id))
            .addLineIf(user, 'User', userMention(user.id))
            .addLineIf(regex, 'Regex', codeBlock(regex))
            .addLine('Tested messages', limit)
            .setFooter({text: interaction.user.id.toString()});
    }
}