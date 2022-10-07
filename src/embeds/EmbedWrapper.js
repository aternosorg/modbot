import {EmbedBuilder} from 'discord.js';

export default class EmbedWrapper extends EmbedBuilder {
    /**
     * convert to discord message
     * @return {{embeds: this[]}}
     */
    toMessage() {
        return {embeds: [this]};
    }
}