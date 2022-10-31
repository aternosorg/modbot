import SubCommand from '../../SubCommand.js';
import {AUTOCOMPLETE_NAME_LIMIT} from '../../../util/apiLimits.js';
import BadWord from '../../../database/BadWord.js';

/**
 * @abstract
 */
export default class CompletingBadWordCommand extends SubCommand {
    async complete(interaction) {
        const focussed = interaction.options.getFocused(true);
        switch (focussed.name) {
            case 'id': {
                const options = [];

                /** @type {import('discord.js').Collection<number, BadWord>} */
                let badWords = await BadWord.getAll(interaction.guildId);

                const value = parseInt(focussed.value);
                if (value) {
                    options.unshift({name: value, value: value});
                    badWords = badWords.filter(response => response.id.toString().includes(focussed.value));
                }

                for (const word of badWords.values()) {
                    let name = `[${word.id}] `;
                    if (word.global) {
                        name += 'global';
                    }
                    else {
                        name += word.channels.map(channel => {
                            channel = (/** @type {import('discord.js').Guild} */ interaction.guild)
                                .channels.cache.get(channel);
                            return '#' + (channel?.name ?? 'unknown');
                        }).join(', ');
                    }
                    name += ` ${word.trigger.type}: ${word.trigger.asContentString()}`;

                    options.push({
                        name: name.slice(0, AUTOCOMPLETE_NAME_LIMIT),
                        value: word.id
                    });
                }

                return options;
            }
        }

        return super.complete(interaction);
    }
}