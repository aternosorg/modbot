import EmbedWrapper from './EmbedWrapper.js';
import colors from '../util/colors.js';
import {AttachmentBuilder, escapeMarkdown} from 'discord.js';
import {EMBED_DESCRIPTION_LIMIT} from '../util/apiLimits.js';

export default class MessageDeleteEmbed extends EmbedWrapper {
    #files = [];

    constructor(message) {
        super();
        this.setColor(colors.RED);
        if (message.system) {
            this.setAuthor({
                name: `A system message was deleted in #${message.channel.name}`
            });
        }
        else {
            /** @type {import('discord.js').GuildMember|import('discord.js').User} */
            const author = message.member ?? message.author;
            this.setAuthor({
                name: `Message by ${escapeMarkdown(author.displayName)} was deleted in #${message.channel.name}`,
                iconURL: author.displayAvatarURL()
            }).setFooter({text:
                    `Message ID: ${message.id}\n` +
                    `Channel ID: ${message.channel.id}\n` +
                    `User ID: ${message.author.id}`
            });

            if (message.content.length) {
                this.setDescription(message.content.substring(0, EMBED_DESCRIPTION_LIMIT));
            }
        }

        for (const attachment of message.attachments.values()) {
            this.#files.push(new AttachmentBuilder(attachment.attachment)
                .setDescription(attachment.description)
                .setName(attachment.name)
                .setSpoiler(true));
        }
    }

    toMessage(ephemeral = true) {
        const message = super.toMessage(ephemeral);
        message.files = this.#files;
        return message;
    }
}