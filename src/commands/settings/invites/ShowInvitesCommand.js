import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import EmbedWrapper from '../../../embeds/EmbedWrapper.js';
import {channelMention} from 'discord.js';
import colors from '../../../util/colors.js';
import ChannelSettings from '../../../settings/ChannelSettings.js';

/**
 * Get the string representation of the allowed status
 * @param {boolean} boolean
 * @returns {string}
 */
function allowed(boolean) {
    return boolean ? 'allowed' : 'forbidden';
}

/**
 * Get the color representation of the allowed status
 * @param {boolean} boolean
 * @returns {number}
 */
function color(boolean) {
    return boolean ? colors.GREEN : colors.RED;
}

/**
 * generate an invite embed
 * @param {import('discord.js').Snowflake} guildId
 * @param {?import('discord.js').Channel} channel
 * @returns {Promise<{ephemeral: boolean, embeds: EmbedWrapper[]}>}
 */
export async function getEmbed(guildId, channel = null) {
    const embed = new EmbedWrapper(),
        guildSettings = await GuildSettings.get(guildId);

    if (channel) {
        const channelSettings = await ChannelSettings.get(channel.id);
        if (channelSettings.invites === null) {
            embed.setDescription(`There is no override for ${channelMention(channel.id)}. Default: ${allowed(guildSettings.invites)}`)
                .setColor(color(guildSettings.invites));
        }
        else {
            embed.setDescription(`Invites are ${allowed(channelSettings.invites)} in ${channelMention(channel.id)}.`)
                .setColor(color(channelSettings.invites));
        }
    }
    else {
        embed.setDescription(`Invites are ${allowed(guildSettings.invites)} per default.`)
            .setColor(color(guildSettings.invites));
    }
    return embed.toMessage();
}

export default class ShowInvitesCommand extends SubCommand {

    buildOptions(builder) {
        builder.addChannelOption(option => option
            .setName('channel')
            .setDescription('get the configuration for this channel')
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        await interaction.reply(await getEmbed(interaction.guildId, channel));
    }

    getDescription() {
        return 'Check if users are allowed to post invites (in this channel)';
    }

    getName() {
        return 'show';
    }
}