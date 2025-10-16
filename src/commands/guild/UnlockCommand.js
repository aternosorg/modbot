import {
    EmbedBuilder, PermissionFlagsBits,
} from 'discord.js';
import colors from '../../util/colors.js';
import ChannelSettings from '../../settings/ChannelSettings.js';
import ChannelWrapper from '../../discord/ChannelWrapper.js';
import {toTitleCase} from '../../util/format.js';
import BaseLockCommand from './BaseLockCommand.js';

export default class UnlockCommand extends BaseLockCommand {
    getStrings() {
        return {
            'options_global_description': 'Unlock all locked channels',
            'message_no_channels': 'There are no locked channels.',
            'modal_title': 'Unlock channels',
            'modal_channels_description': 'Select which channels you want to unlock',
            'modal_message_description': 'Optional message to send in the unlocked channels',
            'message_success': 'Successfully unlocked channels: ',
        };
    }

    /**
     * @param {import('discord.js').BaseInteraction} interaction
     * @returns {Promise<ChannelWrapper[]>}
     */
    async getChannels(interaction) {
        /** @type {ChannelWrapper[]} */
        const channels = [];
        for (const [id, channel] of (await interaction.guild.channels.fetch()).entries()) {
            const channelSettings = await ChannelSettings.get(id);
            if (Object.keys(channelSettings.lock).length) {
                channels.push(new ChannelWrapper(channel));
            }
        }
        return channels;
    }

    getChannelMessageEmbed(message) {
        return new EmbedBuilder()
            .setTitle('This channel has been unlocked')
            .setColor(colors.GREEN)
            .setDescription(message);
    }

    async performAction(channel, wrapper, channelSettings, everyone, embed) {
        // convert old database entries using previous flag names (e.g. SEND_MESSAGES -> SendMessages)
        const unlockPerms = Object.fromEntries(Object.entries(channelSettings.lock ?? {})
            .map(([key, value]) => ([key.split('_').map(toTitleCase).join(''), value])));

        await channel.permissionOverwrites.edit(everyone, unlockPerms);
        channelSettings.lock = {};
        await channelSettings.save();

        if (channel.permissionsFor(everyone).has(PermissionFlagsBits.SendMessages)) {
            await wrapper.tryToSend({embeds: [embed]});
        }
    }

    getDescription() {
        return 'Unlock locked channels';
    }

    getName() {
        return 'unlock';
    }
}
