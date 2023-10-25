import MessageCreateEventListener from './MessageCreateEventListener.js';
import AutoResponse from '../../../database/AutoResponse.js';
import {ThreadChannel} from 'discord.js';
const recentAutoresponse = new Set(); // creates a new Set for cooldowns


export default class AutoResponseEventListener extends MessageCreateEventListener {

    async execute(message) {
        if (!message.guild || message.author.bot) {
            return;
        }
        let channel = message.channel;

        if (channel instanceof ThreadChannel) {
            channel = (/** @type {import('discord.js').ThreadChannel} */ channel).parent;
        }

        /** @type {IterableIterator<AutoResponse>} */
        const responses = (await AutoResponse.get(channel.id, message.guild.id)).values();
        const triggered = Array.from(responses).filter(response => response.matches(message));

		let tagCooldown = 10000 //10 seconds, e.g. 5000 = 5 seconds
        
        if (triggered.length) {
            const response = triggered[Math.floor(Math.random() * triggered.length)];
            if (recentAutoresponse.has(message.channel.id)) { // checks if a tag has been used in this channel in the last <cooldown time>
            	message.react('⏲️') // react with timer emoji to show that there is currently a cooldown active
    		} else {
				await message.reply({content: response.response});
        		recentAutoresponse.add(message.channel.id);
        		setTimeout(() => {
          			recentAutoresponse.delete(message.channel.id); // removes the cooldown after <cooldown time>
        		}, tagCooldown);
    		}
        }
    }
}
