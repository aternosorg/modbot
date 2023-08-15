import {diffWords} from 'diff';
import {
    EmbedBuilder,
    escapeItalic,
    escapeMarkdown,
    escapeStrikethrough,
    strikethrough,
    underscore
} from 'discord.js';
import colors from '../../../util/colors.js';
import GuildWrapper from '../../../discord/GuildWrapper.js';
import {EMBED_DESCRIPTION_LIMIT} from '../../../util/apiLimits.js';
import MessageUpdateEventListener from './MessageUpdateEventListener.js';

export default class LogMessageUpdateEventListener extends MessageUpdateEventListener {
    async execute(oldMessage, message) {
        if (!message.guild || message.author.bot || !oldMessage.content || oldMessage.content === message.content) {
            return;
        }

        const diff = diffWords(oldMessage.content, message.content);

        let formatted = '';
        for (const part of diff) {
            part.value = escapeStrikethrough(escapeItalic(part.value));

            const maxPartLength = EMBED_DESCRIPTION_LIMIT - formatted.length;
            if (part.added) {
                formatted += underscore(part.value.substring(0, maxPartLength - 5)) + ' ';
            }
            else if (part.removed) {
                formatted += strikethrough(part.value.substring(0, maxPartLength - 5)) + ' ';
            }
            else {
                formatted += part.value.substring(0, maxPartLength);
            }

            if (formatted.length === EMBED_DESCRIPTION_LIMIT){
                break;
            }
        }

        const guild = new GuildWrapper(message.guild);
        await guild.logMessage({embeds: [
            new EmbedBuilder()
                .setColor(colors.ORANGE)
                .setAuthor({
                    name: `Message by ${escapeMarkdown(message.member.displayName)} in #${message.channel.name} was edited`,
                    iconURL: message.member.displayAvatarURL()
                })
                .setDescription(formatted.trim())
                .setFooter({text: message.author.id})
        ]});
    }
}