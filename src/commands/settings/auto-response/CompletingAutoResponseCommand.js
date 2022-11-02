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
                let autoResponses = await AutoResponse.getAll(interaction.guildId);

                const value = parseInt(focussed.value);
                if (value) {
                    options.unshift({name: value, value: value});
                    autoResponses = autoResponses.filter(response => response.id.toString().includes(focussed.value));
                }

                for (const response of autoResponses.values()) {
                    let name = `[${response.id}] `;
                    if (response.global) {
                        name += 'global';
                    }
                    else {
                        name += response.channels.map(channel => {
                            channel = (/** @type {import('discord.js').Guild} */ interaction.guild)
                                .channels.cache.get(channel);
                            return '#' + (channel?.name ?? 'unknown');
                        }).join(', ');
                    }
                    name += ` ${response.trigger.type}: ${response.trigger.asContentString()}`;

                    options.push({
                        name: name.slice(0, AUTOCOMPLETE_NAME_LIMIT),
                        value: response.id
                    });
                }

                return options;
            }
        }

        return super.complete(interaction);
    }
}