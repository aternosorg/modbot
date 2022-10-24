import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import KeyValueEmbed from '../../../embeds/KeyValueEmbed.js';
import {formatTime} from '../../../util/timeutils.js';
import colors from '../../../util/colors.js';

export default class ShowPunishmentsCommand extends SubCommand {

    async execute(interaction) {
        const guildSettings = await GuildSettings.get(interaction.guildId);
        const embed = new KeyValueEmbed()
            .setTitle('Punishments')
            .setDescription('No punishments set up yet. Use /settings punishments set to modify them.')
            .setFooter({text: 'Users will receive these punishments when they reach the matching strike counts.\n' +
                    'If no punishment is set for a specific strike count the previous punishment will be used'})
            .setColor(colors.RED);

        for (const [count, punishment] of guildSettings.getPunishments().entries()) {
            const key = count.toString() + ' ' + (count === 1 ? 'strike': 'strikes');
            let value = punishment.action;
            if (punishment.duration) {
                value += ` for ${formatTime(punishment.duration)}`;
            }

            embed.addPair(key, value);
        }
        
        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Show the punishments for reaching specific strike counts.';
    }

    getName() {
        return 'show';
    }
}