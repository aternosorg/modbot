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
                const badWords = await BadWord.getAll(interaction.guildId);

                const value = focussed.value;
                if (value) {
                    options.unshift({name: value, value: parseInt(value)});
                    badWords.filter(response => response.id.toString().includes(value));
                }

                for (const word of badWords.values()) {
                    options.push({
                        name: word.getOverview().slice(0, AUTOCOMPLETE_NAME_LIMIT),
                        value: word.id
                    });
                }

                return options;
            }
        }

        return super.complete(interaction);
    }
}