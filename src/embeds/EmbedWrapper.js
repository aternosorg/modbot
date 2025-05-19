import {EmbedBuilder, MessageFlags} from 'discord.js';

export default class EmbedWrapper extends EmbedBuilder {
    /**
     * convert to discord message
     * @param {boolean} ephemeral should the message be ephemeral
     * @returns {{flags: number, embeds: this[]}}
     */
    toMessage(ephemeral = true) {
        return {flags: ephemeral ? MessageFlags.Ephemeral : 0,  embeds: [this]};
    }
}
