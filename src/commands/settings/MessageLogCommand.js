import GuildSettings from '../../settings/GuildSettings.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import colors from '../../util/colors.js';
import AbstractChannelCommand from './AbstractChannelCommand.js';
import {channelMention} from 'discord.js';

export default class MessageLogCommand extends AbstractChannelCommand {

    buildOptions(builder) {
        builder.addChannelOption(option => option
            .setName('channel')
            .setDescription('Message log channel')
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
        guildSettings.messageLogChannel = channel ? channel.id : channel;
        await guildSettings.save();
        const embed = new EmbedWrapper();
        if (channel) {
            embed.setDescription(`Set message log to ${channelMention(channel.id)}.`)
                .setColor(colors.GREEN);
        }
        else {
            embed.setDescription('Disabled message log.')
                .setColor(colors.RED);
        }
        await interaction.reply(embed.toMessage());
    }

    getDescription() {
        return 'Set the channel where deleted/edited messages are logged';
    }

    getName() {
        return 'message-log';
    }
}