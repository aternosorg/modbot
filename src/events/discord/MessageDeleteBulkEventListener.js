import EventListener from '../EventListener.js';
import {EmbedBuilder, escapeMarkdown} from 'discord.js';
import colors from '../../util/colors.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import {EMBED_DESCRIPTION_LIMIT, MESSAGE_EMBED_LIMIT} from '../../util/apiLimits.js';

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
        let embed = new EmbedBuilder();
        const embeds = [embed];

        for (const message of messages.sort((m1, m2) => m1.createdTimestamp - m2.createdTimestamp).values()) {
            if (!message.content) {
                continue;
            }
            const data = `${escapeMarkdown(message.author.tag)} (${message.author.id}): ${message.content.replaceAll('\n', ' ').trim()}\n`;

            const description = embed.data.description ?? '';
            if (description.length + data.length > EMBED_DESCRIPTION_LIMIT) {
                embed = new EmbedBuilder();
                embeds.push(embed);
            }

            embed.setDescription(description + data);
        }

        for (let i = 0; i < embeds.length; i ++) {
            const page = embeds.length > 1 ? `[${i}/${embeds.length}]` : '';
            embeds[i].setTitle(`${messages.size} messages were deleted in ${channel.name} ${page}`)
                .setColor(colors.RED);
        }

        if (embeds.length === 0 && !embed.data.description) {
            return;
        }

        const guild = new GuildWrapper(channel.guild);
        await guild.logMessage({
            embeds: embeds.slice(0, MESSAGE_EMBED_LIMIT),
        });
    }
}