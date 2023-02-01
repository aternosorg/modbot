import CompletingAutoResponseCommand from './CompletingAutoResponseCommand.js';
import AutoResponse from '../../../database/AutoResponse.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import colors from '../../../util/colors.js';

export default class DeleteAutoReponseCommand extends CompletingAutoResponseCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the auto-response you want to delete')
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

        await autoResponse.delete();
        await interaction.reply(autoResponse
            .embed('Deleted auto-response', colors.RED)
            .toMessage()
        );
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        const id = parts[2];
        const autoResponse = /** @type {?AutoResponse} */
            await AutoResponse.getByID(id, interaction.guildId);

        if (!autoResponse) {
            await interaction.update({
                embeds: [new ErrorEmbed('There is no auto-response with this id.')],
                components: []
            });
            return;
        }

        await autoResponse.delete();
        await interaction.update({
            embeds: [autoResponse.embed('Deleted auto-response', colors.RED)],
            components: [],
        });
    }

    getDescription() {
        return 'Delete an auto-response';
    }

    getName() {
        return 'delete';
    }
}