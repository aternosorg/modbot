import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import CompletingBadWordCommand from './CompletingBadWordCommand.js';
import BadWord from '../../../database/BadWord.js';

export default class ShowBadWordCommand extends CompletingBadWordCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the bad-word you want to view')
            .setMinValue(0)
            .setRequired(true)
            .setAutocomplete(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(interaction.options.getInteger('id', true), interaction.guildId);

        if (!badWord) {
            await interaction.reply(ErrorEmbed.message('There is no bad-word with this id.'));
            return;
        }

        await interaction.reply({
            ephemeral: true,
            embeds: [badWord.embed()],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new ButtonBuilder()
                            .setLabel('Delete')
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(`bad-word:delete:${badWord.id}`),
                        /** @type {*} */
                        new ButtonBuilder()
                            .setLabel('Edit')
                            .setStyle(ButtonStyle.Secondary)
                            .setCustomId(`bad-word:edit:${badWord.id}`)
                    )
            ]
        });
    }

    getDescription() {
        return 'Show a single bad-word';
    }

    getName() {
        return 'show';
    }
}