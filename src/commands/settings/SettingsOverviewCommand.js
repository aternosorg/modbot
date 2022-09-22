import SubCommand from '../SubCommand.js';
import GuildSettings from '../../settings/GuildSettings.js';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';

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
     * @return {Promise<{components: ActionRowBuilder<ButtonBuilder>[], ephemeral: boolean, embeds: EmbedBuilder[]}>}
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
                /** @type {ActionRowBuilder<ButtonBuilder>}*/
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new ButtonBuilder()
                            .setLabel('Refresh')
                            .setStyle(ButtonStyle.Secondary)
                            .setCustomId('settings:overview')
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