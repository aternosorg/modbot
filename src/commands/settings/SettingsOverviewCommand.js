import SubCommand from '../SubCommand.js';
import GuildSettings from '../../settings/GuildSettings.js';
import {
    ButtonStyle,
    ContainerBuilder,
    MessageFlags, SeparatorSpacingSize,
} from 'discord.js';
import {componentEmojiIfExists} from '../../util/format.js';
import icons from '../../util/icons.js';
import BetterButtonBuilder from '../../embeds/BetterButtonBuilder.js';
import Component from '../../components/Component.js';

/**
 * @import {ButtonBuilder} from 'discord.js';
 */

export default class SettingsOverviewCommand extends SubCommand {

    async execute(interaction) {
        await interaction.reply(await this.buildMessage(interaction));
    }

    async executeButton(interaction) {
        await interaction.update(await this.buildMessage(interaction));
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<import('discord.js').MessageCreationOptions>}
     */
    async buildMessage(interaction) {
        const guildSettings = await GuildSettings.get(interaction.guildId);
        const container = new ContainerBuilder()
            .addTextDisplayComponents(Component.h1(`Settings for ${interaction.guild.name}`))
            .addSeparatorComponents(Component.separator(false));

        guildSettings.getSettings(container)
            .addSeparatorComponents(Component.separator(false, SeparatorSpacingSize.Large))
            .addActionRowComponents(Component.actionRow(new BetterButtonBuilder()
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('settings:overview')
                .setEmojiIfPresent(componentEmojiIfExists('refresh', icons.refresh))
            ));

        return {
            components: [container],

            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        };
    }

    getDescription() {
        return 'Show all settings for this guild';
    }

    getName() {
        return 'overview';
    }
}
