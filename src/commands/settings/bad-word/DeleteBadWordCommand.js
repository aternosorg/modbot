import CompletingBadWordCommand from './CompletingBadWordCommand.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import colors from '../../../util/colors.js';
import BadWord from '../../../database/BadWord.js';

export default class DeleteBadWordCommand extends CompletingBadWordCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the bad-word you want to delete')
            .setMinValue(0)
            .setRequired(true)
            .setAutocomplete(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(interaction.options.getInteger('id', true), interaction.guildId);

        if (!badWord) {
            await interaction.reply(ErrorEmbed.message('There is no bad-word with this id.'));
            return;
        }

        await badWord.delete();
        await interaction.reply(badWord
            .embed('Deleted bad-word', colors.RED)
            .toMessage()
        );
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        const id = parts[2];
        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(id, interaction.guildId);

        if (!badWord) {
            await interaction.update({
                embeds: [new ErrorEmbed('There is no bad-word with this id.')],
                components: []
            });
            return;
        }

        await badWord.delete();
        await interaction.update({
            embeds: [badWord.embed('Deleted bad-word', colors.RED)],
            components: [],
        });
    }

    getDescription() {
        return 'Delete a bad-word';
    }

    getName() {
        return 'delete';
    }
}