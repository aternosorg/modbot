import SubCommand from '../../SubCommand.js';
import AutoResponse from '../../../database/AutoResponse.js';
import {AUTOCOMPLETE_NAME_LIMIT} from '../../../util/apiLimits.js';

/**
 * @abstract
 */
export default class CompletingAutoResponseCommand extends SubCommand {
    async complete(interaction) {
        const focussed = interaction.options.getFocused(true);
        switch (focussed.name) {
            case 'id': {
                const options = [];

                /** @type {import('discord.js').Collection<number, AutoResponse>} */
                const autoResponses = await AutoResponse.getAll(interaction.guildId);

                const value = focussed.value;
                if (value) {
                    options.unshift({name: value, value: parseInt(value)});
                    autoResponses.filter(response => response.id.toString().includes(value));
                }

                for (const response of autoResponses.values()) {
                    options.push({
                        name: response.getOverview().slice(0, AUTOCOMPLETE_NAME_LIMIT),
                        value: response.id
                    });
                }

                return options;
            }
        }

        return super.complete(interaction);
    }
}