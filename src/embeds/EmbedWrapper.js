import {EmbedBuilder} from 'discord.js';

export default class EmbedWrapper extends EmbedBuilder {
    /**
     * convert to discord message
     * @param {boolean} ephemeral should the message be ephemeral
     * @returns {{ephemeral: boolean, embeds: this[]}}
     */
    toMessage(ephemeral = true) {
        return {ephemeral,  embeds: [this]};
    }
}