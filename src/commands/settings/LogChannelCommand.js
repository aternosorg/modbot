import GuildSettings from '../../settings/GuildSettings.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import colors from '../../util/colors.js';
import AbstractChannelCommand from './AbstractChannelCommand.js';
import {channelMention} from 'discord.js';

export default class LogChannelCommand extends AbstractChannelCommand {

    buildOptions(builder) {
        builder.addChannelOption(option => option
            .setName('channel')
            .setDescription('Log channel')
            .setRequired(false)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const channel = await this.getChannel(interaction);

        if (channel === false) {
            return;
        }

        const guildSettings = await GuildSettings.get(interaction.guildId);
        guildSettings.logChannel = channel ? channel.id : channel;
        await guildSettings.save();
        const embed = new EmbedWrapper();
        if (channel) {
            embed.setDescription(`Set log channel to ${channelMention(channel.id)}.`)
                .setColor(colors.GREEN);
        }
        else {
            embed.setDescription('Disabled log channel.')
                .setColor(colors.RED);
        }
        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Set the log channel';
    }

    getName() {
        return 'log-channel';
    }
}