import InteractionCreateEventListener from './InteractionCreateEventListener.js';
import {ButtonInteraction} from 'discord.js';
import Confirmation from '../../../database/Confirmation.js';

export default class DeleteConfirmationEventListener extends InteractionCreateEventListener {

    async execute(interaction) {
        if (interaction instanceof ButtonInteraction) {
            if (!interaction.customId) {
                return;
            }

            const parts = interaction.customId.split(':');
            if (parts[0] === 'confirmation') {
                const action = parts[1];
                if (action === 'delete') {
                    const id = parseInt(parts[2]);
                    const confirmation = new Confirmation(null, 0, id);
                    await confirmation.delete();
                    await interaction.update({
                        content: 'This confirmation has been canceled.',
                        embeds: [],
                        components: []
                    });
                }
            }
        }
    }
}