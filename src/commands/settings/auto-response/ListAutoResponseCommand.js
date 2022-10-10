import AutoResponse from '../../../database/AutoResponse.js';
import {MESSAGE_EMBED_LIMIT} from '../../../util/apiLimits.js';
import LineEmbed from '../../../embeds/LineEmbed.js';
import SubCommand from '../../SubCommand.js';

export default class ListAutoResponseCommand extends SubCommand {

    async execute(interaction) {
        const messages = await AutoResponse.getGuildOverview(interaction.guild, 'Auto-response')
            ?? new LineEmbed();
        await interaction.reply({
            ephemeral: true,
            embeds: messages.slice(0, MESSAGE_EMBED_LIMIT)
        });
    }

    getDescription() {
        return 'List all auto-responses in this guild';
    }

    getName() {
        return 'list';
    }
}