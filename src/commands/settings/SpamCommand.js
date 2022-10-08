import SubCommand from '../SubCommand.js';
import GuildSettings from '../../settings/GuildSettings.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import colors from '../../util/colors.js';

export default class SpamCommand extends SubCommand {
    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('value')
            .setDescription('Maximum amount of messages a user can send per minute.')
            .setMinValue(1)
            .setMaxValue(60));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const count = interaction.options.getInteger('value') ?? -1;

        const guildSettings = await GuildSettings.get(interaction.guild.id);
        guildSettings.antiSpam = count;
        await guildSettings.save();
        const embed = new EmbedWrapper();

        if (count === -1) {
            embed.setDescription('Disabled spam protection.')
                .setColor(colors.GREEN);
        }
        else {
            embed.setDescription(`Set spam protection to a maximum of ${count} messages per second.`)
                .setColor(colors.RED);
        }

        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Prevent users from quickly sending lots of messages';
    }

    getName() {
        return 'spam';
    }
}