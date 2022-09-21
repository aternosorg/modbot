import SubCommand from '../SubCommand.js';
import Moderation from '../../database/Moderation.js';
import ModerationEmbed from '../../embeds/ModerationEmbed.js';

export default class ModerationShowCommand extends SubCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the moderation you want to view')
            .setMinValue(0)
            .setRequired(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const id = interaction.options.getInteger('id');
        const moderation = await Moderation.get(interaction.guild.id, id);
        if (!moderation) {
            await interaction.reply({
                ephemeral: true,
                content: 'Unknown Moderation!'
            });
            return;
        }

        await interaction.reply({
            ephemeral: true,
            embeds: [new ModerationEmbed(moderation, await moderation.getUser())]
        });
    }

    getDescription() {
        return 'Show a moderation';
    }

    getName() {
        return 'show';
    }
}