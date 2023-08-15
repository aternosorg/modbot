import Moderation from '../../database/Moderation.js';
import ModerationEmbed from '../../embeds/ModerationEmbed.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import CompletingModerationCommand from './CompletingModerationCommand.js';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';

export default class ModerationShowCommand extends CompletingModerationCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the moderation you want to view')
            .setMinValue(0)
            .setRequired(true)
            .setAutocomplete(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const id = interaction.options.getInteger('id');
        const moderation = await Moderation.get(interaction.guild.id, id);
        if (!moderation) {
            await interaction.reply(ErrorEmbed.message('Unknown Moderation!'));
            return;
        }

        const user = await (await moderation.getMemberWrapper()).fetchMember() ?? await moderation.getUser();
        await interaction.reply({
            ephemeral: true,
            embeds: [new ModerationEmbed(moderation, user)],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new ButtonBuilder()
                            .setLabel('Delete')
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(`moderation:delete:${id}`)
                    )
            ]
        });
    }

    getDescription() {
        return 'Show a moderation';
    }

    getName() {
        return 'show';
    }
}