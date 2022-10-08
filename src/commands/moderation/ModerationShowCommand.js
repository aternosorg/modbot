import Moderation from '../../database/Moderation.js';
import ModerationEmbed from '../../embeds/ModerationEmbed.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import CompletingModerationCommand from './CompletingModerationCommand.js';

export default class ModerationShowCommand extends CompletingModerationCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the moderation you want to view')
            .setMinValue(0)
            .setRequired(true)
            .setAutocomplete(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const id = interaction.options.getInteger('id');
        const moderation = await Moderation.get(interaction.guild.id, id);
        if (!moderation) {
            await interaction.reply(ErrorEmbed.message('Unknown Moderation!'));
            return;
        }

        await interaction.reply(new ModerationEmbed(moderation, await moderation.getUser()).toMessage());
    }

    getDescription() {
        return 'Show a moderation';
    }

    getName() {
        return 'show';
    }
}