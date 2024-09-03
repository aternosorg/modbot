import SubCommand from '../SubCommand.js';
import GuildSettings from '../../settings/GuildSettings.js';
import {ActionRowBuilder, ButtonStyle} from 'discord.js';
import {componentEmojiIfExists} from '../../util/format.js';
import icons from '../../util/icons.js';
import BetterButtonBuilder from '../../embeds/BetterButtonBuilder.js';

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
     * @returns {Promise<{components: ActionRowBuilder<ButtonBuilder>[], ephemeral: boolean, embeds: import('discord.js').EmbedBuilder[]}>}
     */
    async buildMessage(interaction) {
        const guildSettings = await GuildSettings.get(interaction.guildId);
        return {
            ephemeral: true,
            embeds: [
                guildSettings.getSettings()
                    .setAuthor({name: `${interaction.guild.name}| Settings`, iconURL: interaction.guild.iconURL()})
            ],
            components: [
                /** @type {ActionRowBuilder<import('discord.js').ButtonBuilder>}*/
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new BetterButtonBuilder()
                            .setLabel('Refresh')
                            .setStyle(ButtonStyle.Secondary)
                            .setCustomId('settings:overview')
                            .setEmojiIfPresent(componentEmojiIfExists('refresh', icons.refresh))
                    )
            ]
        };
    }

    getDescription() {
        return 'Show all settings for this guild';
    }

    getName() {
        return 'overview';
    }
}