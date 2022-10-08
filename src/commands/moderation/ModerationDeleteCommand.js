import Moderation from '../../database/Moderation.js';
import ModerationEmbed from '../../embeds/ModerationEmbed.js';
import colors from '../../util/colors.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import CompletingModerationCommand from './CompletingModerationCommand.js';

export default class ModerationDeleteCommand extends CompletingModerationCommand {

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

        await moderation.delete();
        const embed = new ModerationEmbed(moderation, await moderation.getUser())
            .setTitle(`Deleted Moderation #${moderation.id} | ${moderation.action.toUpperCase()}`)
            .setColor(colors.RED);
        await interaction.reply({
            ephemeral: true,
            embeds: [embed]
        });
    }

    getDescription() {
        return 'Delete a single moderation';
    }

    getName() {
        return 'delete';
    }
}