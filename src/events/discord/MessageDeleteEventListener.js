import EventListener from '../EventListener.js';
import {EmbedBuilder, escapeMarkdown} from 'discord.js';
import bot from '../../bot/Bot.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import colors from '../../util/colors.js';
import {EMBED_DESCRIPTION_LIMIT} from '../../util/apiLimits.js';

export default class MessageDeleteEventListener extends EventListener {
    get name() {
        return 'messageDelete';
    }

    /**
     * @param {import('discord.js').Message} message
     * @return {Promise<void>}
     */
    async execute(message) {
        if (!message.guild || message.author.bot) {
            return;
        }

        if (bot.deletedMessages.has(message.id)) {
            bot.deletedMessages.delete(message.id);
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(colors.RED);
        if (message.system) {
            embed
                .setAuthor({
                    name: `A system message was deleted in #${message.channel.name}`
                });
        }
        else {
            embed
                .setAuthor({
                    name: `Message by ${escapeMarkdown(message.author.tag)} was deleted in #${message.channel.name}`,
                    iconURL: message.author.avatarURL()
                })
                .setFooter({text: message.author.id});

            if (message.content.length) {
                embed.setDescription(message.content.substring(0, EMBED_DESCRIPTION_LIMIT));
            }
        }

        const files = [];
        for (const attachment of message.attachments.values()) {
            files.push({attachment: attachment.attachment, name: attachment.name, description: attachment.description});
        }

        const guild = new GuildWrapper(message.guild);
        await guild.logMessage({
            embeds: [embed],
            files,
        });
    }
}