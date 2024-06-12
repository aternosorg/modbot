import SubCommand from '../SubCommand.js';
import {formatTime, parseTime} from '../../util/timeutils.js';
import GuildSettings from '../../settings/GuildSettings.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import colors from '../../util/colors.js';

export default class LinkCoolDownCommand extends SubCommand {

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('cool-down')
            .setDescription('Cool-down for users sending links.')
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const coolDown = parseTime(interaction.options.getString('cool-down')),
            guildSettings = await GuildSettings.get(interaction.guildId);

        if (coolDown) {
            guildSettings.linkCooldown = coolDown;
            await guildSettings.save();
            await interaction.reply(new EmbedWrapper()
                .setDescription(`Set link-cool-down to ${formatTime(coolDown)}`)
                .setColor(colors.GREEN)
                .toMessage());
        } else {
            guildSettings.linkCooldown = -1;
            await guildSettings.save();
            await interaction.reply(new EmbedWrapper()
                .setDescription('Disabled link-cool-down.')
                .setColor(colors.RED)
                .toMessage());
        }
    }

    getDescription() {
        return 'Set a cool-down on sending links.';
    }

    getName() {
        return 'link-cool-down';
    }
}