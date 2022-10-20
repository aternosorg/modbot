import AutoResponse from '../../../database/AutoResponse.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import CompletingAutoResponseCommand from './CompletingAutoResponseCommand.js';

export default class ShowAutoReponseCommand extends CompletingAutoResponseCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the auto-response you want to view')
            .setMinValue(0)
            .setRequired(true)
            .setAutocomplete(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const autoResponse = /** @type {?AutoResponse} */
            await AutoResponse.getByID(interaction.options.getInteger('id', true), interaction.guildId);

        if (!autoResponse) {
            await interaction.reply(ErrorEmbed.message('There is no auto-response with this id.'));
            return;
        }

        await interaction.reply({
            ephemeral: true,
            embeds: [autoResponse.embed()],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new ButtonBuilder()
                            .setLabel('Delete')
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(`auto-response:delete:${autoResponse.id}`),
                        /** @type {*} */
                        new ButtonBuilder()
                            .setLabel('Edit')
                            .setStyle(ButtonStyle.Secondary)
                            .setCustomId(`auto-response:edit:${autoResponse.id}`)
                    )
            ]
        });
    }

    getDescription() {
        return 'Show a single auto-response';
    }

    getName() {
        return 'show';
    }
}