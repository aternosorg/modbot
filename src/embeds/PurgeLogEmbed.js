import KeyValueEmbed from './KeyValueEmbed.js';
import colors from '../util/colors.js';
import {bold, channelMention, codeBlock, userMention} from 'discord.js';

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
            .setAuthor({name: `${interaction.member.displayName} purged ${count} messages`})
            .addPair('Moderator ID', interaction.user.id)
            .addPair('Tested messages', limit)
            .newLine()
            .addLine(bold('Filters:'))
            .addPair('Channel', channelMention(interaction.channel.id))
            .addPairIf(user, 'User', userMention(user?.id))
            .addPairIf(regex, 'Regex', codeBlock(regex))
            .setFooter({text: interaction.user.id.toString()});
    }
}