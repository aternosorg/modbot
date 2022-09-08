import MessageCreateEventListener from './MessageCreateEventListener.js';
import AutoResponse from '../../database/AutoResponse.js';

export default class AutoResponseEventListener extends MessageCreateEventListener {

    async execute(message) {
        if (!message.guild || message.author.bot) {
            return;
        }
        /** @type {IterableIterator<AutoResponse>} */
        const responses = await AutoResponse.get(message.channel.id, message.guild.id).values();
        const triggered = Array.from(responses).filter(response => response.matches(message));

        if (triggered.length) {
            const response = triggered[Math.floor(Math.random() * triggered.length)];
            await message.reply({content: response.response});
        }
    }
}