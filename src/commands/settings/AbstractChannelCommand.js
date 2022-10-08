import SubCommand from '../SubCommand.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import {PermissionFlagsBits} from 'discord.js';

/**
 * @abstract
 */
export default class AbstractChannelCommand extends SubCommand {
    /**
     * @param {import('discord.js').Interaction} interaction
     * @return {Promise<import('discord.js').GuildChannel|null|false>}
     */
    async getChannel(interaction) {
        const channelId = interaction.options.getChannel('channel')?.id;
        if (channelId) {
            const channel = await new GuildWrapper(interaction.guild).fetchChannel(channelId);

            if (!channel) {
                await interaction.reply({
                    ephemeral: true,
                    content: 'I can\'t access that channel!'
                });
                return false;
            }

            if (!channel.permissionsFor(interaction.guild.members.me)
                .has(PermissionFlagsBits.SendMessages)) {
                await interaction.reply({
                    ephemeral: true,
                    content: 'I can\'t send messages to that channel!'
                });
                return false;
            }
            return channel;
        }
        return null;
    }
}