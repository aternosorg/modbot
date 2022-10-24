import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import KeyValueEmbed from './KeyValueEmbed.js';
import colors from '../util/colors.js';

export default class ConfirmationEmbed extends KeyValueEmbed {
    /**
     * @param {string} command command name
     * @param {number} confirmation confirmation id
     * @param {import('discord.js').ButtonStyle} [confirmButtonStyle]
     */
    constructor(command, confirmation, confirmButtonStyle = ButtonStyle.Success) {
        super();
        this.command = command;
        this.confirmation = confirmation;
        this.confirmButtonStyle = confirmButtonStyle;
        this.setColor(colors.RED);
    }

    toMessage(ephemeral = true) {
        return {
            ephemeral,
            embeds: [this],
            components: [new ActionRowBuilder()
                .addComponents(/** @type {*} */ new ButtonBuilder()
                    .setCustomId(`${this.command}:confirm:${this.confirmation}`)
                    .setStyle(this.confirmButtonStyle)
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