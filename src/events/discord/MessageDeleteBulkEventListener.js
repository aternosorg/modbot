import EventListener from '../EventListener.js';
import {EmbedBuilder, escapeMarkdown} from 'discord.js';
import colors from '../../util/colors.js';
import GuildWrapper from '../../discord/GuildWrapper.js';

const MESSAGE_EMBED_LIMIT = 10;
const EMBED_DESCRIPTION_LIMIT = 4096;


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

        for (const message of messages.values()) {
            const data = `${escapeMarkdown(message.author.tag)} (${message.author.id}): ${message.content.replaceAll('\n', '').trim()}\n`;

            if (embed.data.description.length + data.length > EMBED_DESCRIPTION_LIMIT) {
                embed = new EmbedBuilder();
                embeds.push(embed);
            }

            embed.setDescription(embed.data.description + data);
        }

        for (let i = 0; i < embeds.length; i ++) {
            const page = embeds.length > 1 ? `[${i}/${embeds.length}]` : '';
            embeds[i].setTitle(`${messages.size} messages were deleted in ${channel.name} ${page}`)
                .setColor(colors.RED);
        }

        const guild = new GuildWrapper(channel.guild);
        await guild.logMessage({
            embeds: embeds.slice(0, MESSAGE_EMBED_LIMIT),
        });
    }
}