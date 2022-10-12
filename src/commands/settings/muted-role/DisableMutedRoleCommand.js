import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import EmbedWrapper from '../../../embeds/EmbedWrapper.js';
import colors from '../../../util/colors.js';

export default class DisableMutedRoleCommand extends SubCommand {
    async execute(interaction) {
        const guildSettings = await GuildSettings.get(interaction.guildId);
        guildSettings.mutedRole = null;
        await guildSettings.save();
        await interaction.reply(new EmbedWrapper()
            .setDescription('The muted role has been disabled.')
            .setFooter({text: 'This command doesn\'t unmute currently muted members!'})
            .setColor(colors.GREEN)
            .toMessage());
    }

    getDescription() {
        return 'Disable the muted role';
    }

    getName() {
        return 'disable';
    }
}