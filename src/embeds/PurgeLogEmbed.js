import KeyValueEmbed from './KeyValueEmbed.js';
import colors from '../util/colors.js';
import {channelMention, codeBlock, userMention} from 'discord.js';

export default class PurgeLogEmbed extends KeyValueEmbed {
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
            .addPair('Channel', channelMention(interaction.channel.id))
            .addPairIf(user, 'User', userMention(user?.id))
            .addPairIf(regex, 'Regex', codeBlock(regex))
            .addPair('Tested messages', limit)
            .setFooter({text: interaction.user.id.toString()});
    }
}