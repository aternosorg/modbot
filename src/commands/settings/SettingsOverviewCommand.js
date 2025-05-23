import SubCommand from '../SubCommand.js';
import GuildSettings from '../../settings/GuildSettings.js';
import {
    ButtonStyle,
    MessageFlags,
    SeparatorSpacingSize,
} from 'discord.js';
import {componentEmojiIfExists} from '../../util/format.js';
import icons from '../../util/icons.js';
import BetterButtonBuilder from '../../formatting/embeds/BetterButtonBuilder.js';
import MessageBuilder from '../../formatting/MessageBuilder.js';

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
        const builder = new MessageBuilder()
            .heading(`Settings for ${interaction.guild.name}`)
            .separator(false);

        guildSettings.getSettings(builder)
            .separator(false, SeparatorSpacingSize.Large)
            .button(new BetterButtonBuilder()
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('settings:overview')
                .setEmojiIfPresent(componentEmojiIfExists('refresh', icons.refresh))
            );

        return {
            components: [builder.endComponent()],
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
