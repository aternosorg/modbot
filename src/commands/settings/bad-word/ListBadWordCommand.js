import {MESSAGE_EMBED_LIMIT} from '../../../util/apiLimits.js';
import LineEmbed from '../../../embeds/LineEmbed.js';
import SubCommand from '../../SubCommand.js';
import BadWord from '../../../database/BadWord.js';

export default class ListBadWordCommand extends SubCommand {

    async execute(interaction) {
        const messages = await BadWord.getGuildOverview(interaction.guild, 'Bad-word')
            ?? new LineEmbed();
        await interaction.reply({
            ephemeral: true,
            embeds: messages.slice(0, MESSAGE_EMBED_LIMIT)
        });
    }

    getDescription() {
        return 'List all bad-words in this guild';
    }

    getName() {
        return 'list';
    }
}