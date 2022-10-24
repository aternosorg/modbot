import GuildSettings from '../../settings/GuildSettings.js';
import AbstractChannelCommand from './AbstractChannelCommand.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import colors from '../../util/colors.js';
import {channelMention} from 'discord.js';

export default class JoinLogCommand extends AbstractChannelCommand {

    buildOptions(builder) {
        builder.addChannelOption(option => option
            .setName('channel')
            .setDescription('Join log channel')
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
        guildSettings.joinLogChannel = channel ? channel.id : channel;
        await guildSettings.save();
        const embed = new EmbedWrapper();
        if (channel) {
            embed.setDescription(`Set join log to ${channelMention(channel.id)}.`)
                .setColor(colors.GREEN);
        }
        else {
            embed.setDescription('Disabled join log.')
                .setColor(colors.RED);
        }
        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Set the channel where joins and leaves messages are logged';
    }

    getName() {
        return 'join-log';
    }
}