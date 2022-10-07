import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import KeyValueEmbed from './KeyValueEmbed.js';
import colors from '../util/colors.js';

export default class ConfirmationEmbed extends KeyValueEmbed {
    /**
     * @param {string} command command name
     * @param {number} confirmation confirmation id
     */
    constructor(command, confirmation) {
        super();
        this.command = command;
        this.confirmation = confirmation;
        this.setColor(colors.RED);
    }

    toMessage(ephemeral = true) {
        return {
            ephemeral,
            embeds: [this],
            components: [new ActionRowBuilder()
                .addComponents(/** @type {*} */ new ButtonBuilder()
                    .setCustomId(`${this.command}:confirm:${this.confirmation}`)
                    .setStyle(ButtonStyle.Success)
                    .setLabel('Confirm'),
                )
                .addComponents(/** @type {*} */ new ButtonBuilder()
                    .setCustomId(`confirmation:delete:${this.confirmation}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Cancel')
                )
            ]
        };
    }
}