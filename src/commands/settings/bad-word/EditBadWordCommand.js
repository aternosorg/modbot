import CompletingBadWordCommand from './CompletingBadWordCommand.js';
import Confirmation from '../../../database/Confirmation.js';
import {formatTime, parseTime, timeAfter} from '../../../util/timeutils.js';
import {
    ActionRowBuilder,
    channelMention,
    ChannelSelectMenuBuilder, ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import colors from '../../../util/colors.js';
import BadWord from '../../../database/BadWord.js';
import Punishment from '../../../database/Punishment.js';
import {SELECT_MENU_OPTIONS_LIMIT} from '../../../util/apiLimits.js';
import config from '../../../bot/Config.js';

/**
 * @import {PunishmentAction} from '../../../database/Punishment.js';
 */

export default class EditBadWordCommand extends CompletingBadWordCommand {

    buildOptions(builder) {
        builder.addIntegerOption(option => option
            .setName('id')
            .setDescription('The id of the bad-word you want to delete')
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
            .setDescription('How is this bad-word triggered?')
        );
        builder.addBooleanOption(option => option
            .setName('global')
            .setDescription('Use bad-word in all channels')
            .setRequired(false));
        builder.addStringOption(option => option
            .setName('punishment')
            .setDescription('Punishment Type')
            .setChoices(
                {
                    name: 'None [default]',
                    value: 'none'
                }, {
                    name: 'Ban user',
                    value: 'ban'
                }, {
                    name: 'Kick user',
                    value: 'kick'
                }, {
                    name: 'Mute user',
                    value: 'mute'
                }, {
                    name: 'Softban user',
                    value: 'softban'
                }, {
                    name: 'Strike user',
                    value: 'strike'
                }
            )
        );

        if (config.data.googleCloud.vision.enabled) {
            builder.addBooleanOption(option => option
                .setName('image-detection')
                .setDescription('Respond to images containing text that matches the trigger')
                .setRequired(false));
        }

        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(interaction.options.getInteger('id', true), interaction.guildId);

        if (!badWord) {
            await interaction.reply(ErrorEmbed.message('There is no bad-word with this id.'));
            return;
        }

        const global = interaction.options.getBoolean('global'),
            type = interaction.options.getString('type'),
            punishment = interaction.options.getString('punishment'),
            vision = interaction.options.getBoolean('image-detection');
        await this.showModal(interaction, badWord, global, type, punishment, vision);
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(parts[2], interaction.guildId);

        if (!badWord) {
            await interaction.update({
                embeds: [new ErrorEmbed('There is no bad-word with this id.')],
                components: []
            });
            return;
        }

        await this.showModal(interaction, badWord, null, null, null, null);
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {BadWord} badWord
     * @param {?boolean} global
     * @param {?string} type
     * @param {?string} punishment
     * @param {?boolean} vision
     * @returns {Promise<void>}
     */
    async showModal(
        interaction,
        badWord,
        global,
        type,
        punishment,
        vision,
    ) {
        global ??= badWord.global;
        type ??= badWord.trigger.type;
        punishment ??= badWord.punishment.action;
        vision ??= badWord.enableVision;

        let trigger = badWord.trigger;
        if (type === 'regex') {
            trigger = trigger.toRegex();
        }

        const confirmation = new Confirmation({global, type, id: badWord.id, punishment, vision}, timeAfter('1 hour'));
        const modal = new ModalBuilder()
            .setTitle(`Edit Bad-word #${badWord.id}`)
            .setCustomId(`bad-word:edit:${await confirmation.save()}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(true)
                            .setCustomId('trigger')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder(BadWord.getTriggerPlaceholder(type))
                            .setLabel('Trigger')
                            .setValue(trigger.asContentString()),
                    ),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(false)
                            .setCustomId('response')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Hi there :wave:')
                            .setLabel('Response')
                            .setValue(badWord.response)
                            .setMinLength(1)
                            .setMaxLength(4000)
                    ),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(false)
                            .setCustomId('priority')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('0')
                            .setLabel('Priority')
                            .setValue(badWord.priority.toString())
                            .setMinLength(1)
                            .setMaxLength(10)
                    ),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(false)
                            .setCustomId('dm')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('This is a direct message sent to the user when their message was deleted')
                            .setLabel('Direct Message')
                            .setMinLength(1)
                            .setMaxLength(3000)
                    ),
            );

        if (['ban', 'mute'].includes(punishment)) {
            modal.addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(false)
                            .setCustomId('duration')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Punishment duration')
                            .setLabel('duration')
                            .setMinLength(0)
                            .setMaxLength(4000)
                            .setValue(formatTime(badWord.punishment.duration))
                    )
            );
        }

        await interaction.showModal(modal);
    }

    async executeModal(interaction) {
        const confirmationId = interaction.customId.split(':')[2];
        const confirmation = await Confirmation.get(confirmationId);

        if (!confirmation) {
            await interaction.reply(ErrorEmbed.message('This confirmation has expired.'));
            return;
        }

        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(confirmation.data.id, interaction.guildId);

        if (!badWord) {
            await interaction.reply(ErrorEmbed.message('There is no bad-word with this id.'));
            return;
        }

        let trigger, response, duration = null, priority = null, dm = null;
        for (let component of interaction.components) {
            component = component.components[0];
            switch (component.customId) {
                case 'trigger':
                    trigger = component.value;
                    break;
                case 'response':
                    response = component.value?.substring?.(0, 4000);
                    break;
                case 'duration':
                    duration = parseTime(component.value) || null;
                    break;
                case 'priority':
                    priority = parseInt(component.value) || 0;
                    break;
                case 'dm':
                    dm = component.value?.substring?.(0, 3000);
                    break;
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
                confirmation.data.punishment,
                duration,
                priority,
                dm,
                confirmation.data.vision,
            );
        } else {
            confirmation.data.trigger = trigger;
            confirmation.data.response = response;
            confirmation.data.duration = duration;
            confirmation.data.priority = priority;
            confirmation.expires = timeAfter('30 min');

            await interaction.reply({
                ephemeral: true,
                content: `Select channels for the bad-word. Currently selected channels: ${
                    badWord.channels.map(c => channelMention(c)).join(', ')}`,
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
                        .setCustomId(`bad-word:edit:${await confirmation.save()}`)
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
            confirmation.data.punishment,
            confirmation.data.duration,
            confirmation.data.priority,
            confirmation.data.vision,
        );
    }

    /**
     * create the bad word
     * @param {import('discord.js').Interaction} interaction
     * @param {number} id
     * @param {boolean} global
     * @param {import('discord.js').Snowflake[]} channels
     * @param {string} type
     * @param {string} trigger
     * @param {string} response
     * @param {PunishmentAction} punishment
     * @param {?number} duration
     * @param {number} priority
     * @param {?string} dm
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
        punishment,
        duration,
        priority,
        dm,
        vision,
    ) {
        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(id, interaction.guildId);

        if (!badWord) {
            await interaction.reply(ErrorEmbed.message('There is no bad-word with this id.'));
            return;
        }

        badWord.global = global;
        badWord.channels = channels;
        badWord.enableVision = vision;
        const triggerResponse = BadWord.getTrigger(type, trigger);
        if (!triggerResponse.success) {
            return interaction.reply(ErrorEmbed.message(triggerResponse.message));
        }
        badWord.trigger = triggerResponse.trigger;
        badWord.response = response || 'disabled';
        badWord.dm = dm || 'disabled';
        badWord.punishment = new Punishment({action: punishment, duration});
        badWord.priority = priority;
        await badWord.save();

        await interaction.reply(badWord
            .embed('Edited Bad-word', colors.GREEN)
            .toMessage()
        );
    }

    getDescription() {
        return 'Modify an bad-word';
    }

    getName() {
        return 'edit';
    }
}