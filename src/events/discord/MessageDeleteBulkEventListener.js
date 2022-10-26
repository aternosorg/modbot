import EventListener from '../EventListener.js';
import {EmbedBuilder, escapeMarkdown} from 'discord.js';
import colors from '../../util/colors.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import {EMBED_DESCRIPTION_LIMIT} from '../../util/apiLimits.js';

export default class MessageDeleteBulkEventListener extends EventListener {
    get name() {
        return 'messageDeleteBulk';
    }

    /**
     * @param {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').Message>} messages
     * @param {import('discord.js').GuildTextBasedChannel} channel
     * @return {Promise<unknown>}
     */
    async execute(messages, channel) {
        const embed = new EmbedBuilder()
            .setTitle(`${messages.size} messages were deleted in ${channel.name}`)
            .setColor(colors.RED);
        for (const message of messages.sort((m1, m2) => m1.createdTimestamp - m2.createdTimestamp).values()) {
            if (!message.content) {
                continue;
            }
            const data = `${escapeMarkdown(message.author.tag)} (${message.author.id}): ${message.content.replaceAll('\n', ' ').trim()}\n`;

            const description = embed.data.description ?? '';
            embed.setDescription((description + data).substring(0, EMBED_DESCRIPTION_LIMIT));
            if (description.length + data.length > EMBED_DESCRIPTION_LIMIT) {
                embed.setFooter({text: 'This message was shortened due to Discord API limitations.'});
                break;
            }
        }

        if (!embed.data.description) {
            return;
        }

        const guild = new GuildWrapper(channel.guild);
        await guild.logMessage({
            embeds: [embed],
        });
    }
}