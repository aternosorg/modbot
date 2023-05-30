import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import {formatTime, parseTime} from '../../../util/timeutils.js';
import colors from '../../../util/colors.js';
import EmbedWrapper from '../../../embeds/EmbedWrapper.js';
import Punishment from '../../../database/Punishment.js';

export default class SetPunishmentsCommand extends SubCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('strike-count')
            .setDescription('Strike count after which this punishment will be applied')
            .setMinValue(0)
            .setRequired(true)
        );
        builder.addStringOption(option => option
            .setName('punishment')
            .setDescription('Punishment type for reaching this strike count')
            .setRequired(true)
            .setChoices(
                { name: 'Ban user', value: 'ban' },
                { name: 'Kick user', value: 'kick' },
                { name: 'Mute user', value: 'mute' },
                { name: 'Softban user', value: 'softban' },
                { name: 'Remove punishment', value: 'none' },
            )
        );
        builder.addStringOption(option => option
            .setName('duration')
            .setDescription('Punishment duration (if applicable)')
            .setRequired(false)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const count = interaction.options.getInteger('strike-count', true),
            action = interaction.options.getString('punishment', true),
            guildSettings = await GuildSettings.get(interaction.guildId);

        if (action === 'none') {
            await guildSettings.setPunishment(count, null);
            return interaction.reply(new EmbedWrapper()
                .setDescription(`Removed punishment for ${count} ${count === 1 ? 'strike': 'strikes'}`)
                .setColor(colors.GREEN)
                .toMessage());
        }

        const duration = parseTime(interaction.options.getString('duration'));
        await guildSettings.setPunishment(count, new Punishment({
            action,
            count,
            duration
        }));
        await interaction.reply(new EmbedWrapper()
            .setDescription(`Set punishment for ${count} ${count === 1 ? 'strike': 'strikes'} to ${action}${duration ? ` for ${formatTime(duration)}` : ''}.`)
            .setColor(colors.RED)
            .toMessage());
    }

    getDescription() {
        return 'Set the punishment for reaching a specific strike count.';
    }

    getName() {
        return 'set';
    }
}