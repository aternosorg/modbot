import {
    EmbedBuilder,
} from 'discord.js';
import colors from '../../util/colors.js';
import ChannelWrapper, {CHANNEL_LOCK_PERMISSIONS} from '../../discord/ChannelWrapper.js';
import BaseLockCommand from './BaseLockCommand.js';

export default class LockCommand extends BaseLockCommand {
    getStrings() {
        return {
            'options_global_description': 'Lock all lockable channels',
            'message_no_channels': 'There are no channels to lock.',
            'modal_title': 'Lock channels',
            'modal_channels_description': 'Select which channels you want to lock',
            'modal_message_description': 'Optional message to send in the locked channels',
            'message_success': 'Successfully locked channels: ',
        };
    }

    /**
     * @param {import('discord.js').BaseInteraction} interaction
     * @returns {Promise<ChannelWrapper[]>}
     */
    async getChannels(interaction) {
        return (await interaction.guild.channels.fetch())
            .map(channel => new ChannelWrapper(channel))
            .filter(channel => channel.isLockable());
    }

    getChannelMessageEmbed(message) {
        return new EmbedBuilder()
            .setTitle('This channel has been locked')
            .setColor(colors.RED)
            .setDescription(message)
            .setFooter({text: 'You are not muted, this channel is locked for everyone. Please don\'t DM people.'});
    }

    async performAction(channel, wrapper, channelSettings, everyone, embed) {
        await wrapper.tryToSend({embeds: [embed]});

        const permissionEditOptions = {};
        for (const permission of CHANNEL_LOCK_PERMISSIONS) {
            if (!channel.permissionsFor(everyone).has(permission))
                continue;

            const overwrite = channel.permissionOverwrites.cache.get(everyone);
            channelSettings.lock[permission] = !overwrite ? null : overwrite.allow.has(permission) ? true : null;
            permissionEditOptions[permission] = false;
        }

        await channel.permissionOverwrites.edit(everyone, permissionEditOptions);
        await channelSettings.save();
    }

    getDescription() {
        return 'Stop users from sending messages and adding reactions in one or more channels';
    }

    getName() {
        return 'lock';
    }
}
