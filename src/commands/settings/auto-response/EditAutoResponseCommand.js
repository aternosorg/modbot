import CompletingAutoResponseCommand from './CompletingAutoResponseCommand.js';
import Confirmation from '../../../database/Confirmation.js';
import {timeAfter} from '../../../util/timeutils.js';
import {
    ActionRowBuilder,
    channelMention,
    ChannelSelectMenuBuilder,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import AutoResponse from '../../../database/AutoResponse.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import colors from '../../../util/colors.js';
import {SELECT_MENU_OPTIONS_LIMIT} from '../../../util/apiLimits.js';
import config from '../../../bot/Config.js';

export default class EditAutoResponseCommand extends CompletingAutoResponseCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the auto-response you want to delete')
            .setMinValue(0)
            .setRequired(true)
            .setAutocomplete(true)
        );
        builder.addStringOption(option => option
            .setName('type')
            .setChoices(
                {
                    name: 'Regular expression',
                    value: 'regex'
                }, {
                    name: 'Include (ignore case) [default]',
                    value: 'include'
                }, {
                    name: 'Match full message (ignore case)',
                    value: 'match'
                }, {
                    name: 'Phishing domains (e.g. "discord.com(gg):0.8")',
                    value: 'phishing'
                }
            )
            .setDescription('How is this auto-response triggered?')
        );
        builder.addBooleanOption(option => option
            .setName('global')
            .setDescription('Use auto-response in all channels')
            .setRequired(false));

        if (config.data.googleCloud.vision.enabled) {
            builder.addBooleanOption(option => option
                .setName('image-detection')
                .setDescription('Respond to images containing text that matches the trigger')
                .setRequired(false));
        }

        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const autoResponse = /** @type {?AutoResponse} */
            await AutoResponse.getByID(interaction.options.getInteger('id', true), interaction.guildId);

        if (!autoResponse) {
            await interaction.reply(ErrorEmbed.message('There is no auto-response with this id.'));
            return;
        }

        const global = interaction.options.getBoolean('global'),
            type = interaction.options.getString('type'),
            vision = interaction.options.getBoolean('image-detection');
        await this.showModal(interaction, autoResponse, global, type, vision);
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        const autoResponse = /** @type {?AutoResponse} */
            await AutoResponse.getByID(parts[2], interaction.guildId);

        if (!autoResponse) {
            await interaction.update({
                embeds: [new ErrorEmbed('There is no auto-response with this id.')],
                components: []
            });
            return;
        }

        await this.showModal(interaction, autoResponse, null, null, null);
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {AutoResponse} autoResponse
     * @param {?boolean} global
     * @param {?string} type
     * @param {?boolean} vision
     * @returns {Promise<void>}
     */
    async showModal(interaction, autoResponse, global, type, vision) {
        global ??= autoResponse.global;
        type ??= autoResponse.trigger.type;
        vision ??= autoResponse.enableVision;

        let trigger = autoResponse.trigger;
        if (type === 'regex') {
            trigger = trigger.toRegex();
        }

        const confirmation = new Confirmation({global, type, id: autoResponse.id, vision}, timeAfter('1 hour'));
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Edit Auto-response #${autoResponse.id}`)
            .setCustomId(`auto-response:edit:${await confirmation.save()}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(true)
                            .setCustomId('trigger')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder(AutoResponse.getTriggerPlaceholder(type))
                            .setLabel('Trigger')
                            .setValue(trigger.asContentString()),
                    ),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(true)
                            .setCustomId('response')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Hi there :wave:')
                            .setLabel('Response')
                            .setValue(autoResponse.response)
                    )
            ));
    }

    async executeModal(interaction) {
        const confirmationId = interaction.customId.split(':')[2];
        const confirmation = await Confirmation.get(confirmationId);

        if (!confirmation) {
            await interaction.reply(ErrorEmbed.message('This confirmation has expired.'));
            return;
        }

        const autoResponse = /** @type {?AutoResponse} */
            await AutoResponse.getByID(confirmation.data.id, interaction.guildId);

        if (!autoResponse) {
            await interaction.reply(ErrorEmbed.message('There is no auto-response with this id.'));
            return;
        }

        let trigger, response;
        for (let component of interaction.components) {
            component = component.components[0];
            if (component.customId === 'trigger') {
                trigger = component.value;
            }
            else if (component.customId === 'response') {
                response = component.value;
            }
        }

        if (confirmation.data.global) {
            await confirmation.delete();
            await this.update(
                interaction,
                confirmation.data.id,
                confirmation.data.global,
                [],
                confirmation.data.type,
                trigger,
                response,
                confirmation.data.vision,
            );
        } else {
            confirmation.data.trigger = trigger;
            confirmation.data.response = response;
            confirmation.expires = timeAfter('30 min');

            await interaction.reply({
                ephemeral: true,
                content: `Select channels for the auto-response. Currently selected channels: ${
                    autoResponse.channels.map(c => channelMention(c)).join(', ')}`,
                components: [
                    /** @type {ActionRowBuilder} */
                    new ActionRowBuilder().addComponents(/** @type {*} */new ChannelSelectMenuBuilder()
                        .addChannelTypes(/** @type {*} */[
                            ChannelType.GuildText,
                            ChannelType.GuildForum,
                            ChannelType.GuildAnnouncement,
                            ChannelType.GuildStageVoice,
                        ])
                        .setMinValues(1)
                        .setMaxValues(SELECT_MENU_OPTIONS_LIMIT)
                        .setCustomId(`auto-response:edit:${await confirmation.save()}`)
                    )
                ]
            });
        }
    }

    async executeSelectMenu(interaction) {
        const confirmationId = interaction.customId.split(':')[2];
        const confirmation = await Confirmation.get(confirmationId);

        if (!confirmation) {
            await interaction.update(ErrorEmbed.message('This confirmation has expired.'));
            return;
        }

        await this.update(
            interaction,
            confirmation.data.id,
            confirmation.data.global,
            interaction.values,
            confirmation.data.type,
            confirmation.data.trigger,
            confirmation.data.response,
            confirmation.data.vision,
        );
    }

    /**
     * create the auto response
     * @param {import('discord.js').Interaction} interaction
     * @param {number} id
     * @param {boolean} global
     * @param {import('discord.js').Snowflake[]} channels
     * @param {string} type
     * @param {string} trigger
     * @param {string} response
     * @param {?boolean} vision
     * @returns {Promise<*>}
     */
    async update(
        interaction,
        id,
        global,
        channels,
        type,
        trigger,
        response,
        vision,
    ) {
        const autoResponse =
            /** @type {?AutoResponse} */
            await AutoResponse.getByID(id, interaction.guildId);

        if (!autoResponse) {
            await interaction.reply(ErrorEmbed.message('There is no auto-response with this id.'));
            return;
        }

        autoResponse.global = global;
        autoResponse.channels = channels;
        autoResponse.enableVision = vision;
        const triggerResponse = AutoResponse.getTrigger(type, trigger);
        if (!triggerResponse.success) {
            return interaction.reply(ErrorEmbed.message(triggerResponse.message));
        }
        autoResponse.trigger = triggerResponse.trigger;
        autoResponse.response = response;
        await autoResponse.save();

        await interaction.reply(autoResponse
            .embed('Edited auto-response', colors.GREEN)
            .toMessage()
        );
    }

    getDescription() {
        return 'Modify an auto-response';
    }

    getName() {
        return 'edit';
    }
}