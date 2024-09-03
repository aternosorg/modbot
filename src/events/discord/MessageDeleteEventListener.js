import EventListener from '../EventListener.js';
import bot from '../../bot/Bot.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import MessageDeleteEmbed from '../../embeds/MessageDeleteEmbed.js';

export default class MessageDeleteEventListener extends EventListener {
    get name() {
        return 'messageDelete';
    }

    /**
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async execute(message) {
        if (!message.guild || message.author.bot) {
            return;
        }

        if (bot.deletedMessages.has(message.id)) {
            bot.deletedMessages.delete(message.id);
            return;
        }

        const embed = new MessageDeleteEmbed(message);

        const guild = new GuildWrapper(message.guild);
        await guild.logMessage(embed.toMessage());
    }
}