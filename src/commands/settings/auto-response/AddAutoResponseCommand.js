import SubCommand from '../../SubCommand.js';
import {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import Confirmation from '../../../database/Confirmation.js';
import {timeAfter} from '../../../util/timeutils.js';
import AutoResponse from '../../../database/AutoResponse.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import colors from '../../../util/colors.js';
import {SELECT_MENU_OPTIONS_LIMIT} from '../../../util/apiLimits.js';
import config from '../../../bot/Config.js';

export default class AddAutoResponseCommand extends SubCommand {

    buildOptions(builder) {
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
        const global = interaction.options.getBoolean('global') ?? false,
            type = interaction.options.getString('type') ?? 'include',
            vision = interaction.options.getBoolean('image-detection') ?? false;

        const confirmation = new Confirmation({global, type, vision}, timeAfter('1 hour'));
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Create new Auto-response of type ${type}`)
            .setCustomId(`auto-response:add:${await confirmation.save()}`)
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
                            .setMinLength(1)
                            .setMaxLength(4000),
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
                            .setMinLength(1)
                            .setMaxLength(4000)
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
            await this.create(
                interaction,
                confirmation.data.global,
                [],
                confirmation.data.type,
                trigger,
                response,
                confirmation.data.vision,
            );
        }
        else {
            confirmation.data.trigger = trigger;
            confirmation.data.response = response;
            confirmation.expires = timeAfter('30 min');

            await interaction.reply({
                ephemeral: true,
                content: 'Select channels for the auto-response',
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
                        .setCustomId(`auto-response:add:${await confirmation.save()}`)
                    ),
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

        await this.create(
            interaction,
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
     * @param {boolean} global
     * @param {import('discord.js').Snowflake[]} channels
     * @param {string} type
     * @param {string} trigger
     * @param {string} response
     * @param {?boolean} enableVision
     * @returns {Promise<*>}
     */
    async create(
        interaction,
        global,
        channels,
        type,
        trigger,
        response,
        enableVision,
    ) {
        const result = await AutoResponse.new(
            interaction.guild.id,
            global,
            channels,
            type,
            trigger,
            response,
            enableVision,
        );
        if (!result.success) {
            return interaction.reply(ErrorEmbed.message(result.message));
        }

        await interaction.reply(result.response
            .embed('Added new auto-response', colors.GREEN)
            .toMessage()
        );
    }

    getDescription() {
        return 'Add a new auto-response';
    }

    getName() {
        return 'add';
    }
}