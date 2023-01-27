import AutoResponse from '../../../database/AutoResponse.js';
import SubCommand from '../../SubCommand.js';

export default class ListAutoResponseCommand extends SubCommand {

    async execute(interaction) {
        const embeds = await AutoResponse.getGuildOverview(interaction.guild, 'Auto-response');

        for (const [index, embed] of embeds.entries()) {
            const options = { ephemeral: true, embeds: [embed] };
            if (index === 0) {
                await interaction.reply(options);
            }
            else {
                await interaction.followUp(options);
            }
        }
    }

    getDescription() {
        return 'List all auto-responses in this guild';
    }

    getName() {
        return 'list';
    }
}