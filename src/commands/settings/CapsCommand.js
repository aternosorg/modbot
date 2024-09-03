import SubCommand from '../SubCommand.js';
import GuildSettings from '../../settings/GuildSettings.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import colors from '../../util/colors.js';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';

export default class CapsCommand extends SubCommand {

    buildOptions(builder) {
        builder.addBooleanOption(option => option
            .setName('enabled')
            .setDescription('Delete messages with more than 70% capital letters')
            .setRequired(true));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const enabled = interaction.options.getBoolean('enabled', true);

        const options = await this.change(interaction, enabled);
        options.ephemeral = true;
        await interaction.reply(options);
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {boolean} enabled
     * @returns {Promise<{components: ActionRowBuilder<ButtonBuilder>[], embeds: EmbedWrapper[]}>}
     */
    async change(interaction, enabled) {
        const guildSettings = await GuildSettings.get(interaction.guild.id);
        guildSettings.caps = enabled;
        await guildSettings.save();

        const embed = new EmbedWrapper(), button = new ButtonBuilder();
        if (enabled) {
            embed.setDescription('Enabled caps moderation!')
                .setColor(colors.GREEN);
            button.setLabel('Disable')
                .setStyle(ButtonStyle.Danger)
                .setCustomId('settings:caps:disable');
        }
        else {
            embed.setDescription('Disabled caps moderation!')
                .setColor(colors.RED);
            button.setLabel('Enable')
                .setStyle(ButtonStyle.Success)
                .setCustomId('settings:caps:enable');
        }

        return  {
            embeds: [embed],
            components: [
                /** @type {ActionRowBuilder<ButtonBuilder>} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ button)
            ]
        };
    }

    async executeButton(interaction) {
        let enabled;
        switch (interaction.customId.split(':')[2]) {
            case 'enable':
                enabled = true;
                break;

            case 'disable':
                enabled = false;
                break;

            default:
                await interaction.reply(ErrorEmbed.message('Unknown action!'));
                return;
        }

        await interaction.update(await this.change(interaction, enabled));
    }

    getDescription() {
        return 'Manage the deletion of messages with too many capital letters';
    }

    getName() {
        return 'caps';
    }
}