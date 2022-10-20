import CompletingBadWordCommand from './CompletingBadWordCommand.js';
import Confirmation from '../../../database/Confirmation.js';
import {formatTime, parseTime, timeAfter} from '../../../util/timeutils.js';
import {ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle} from 'discord.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import ChannelWrapper from '../../../discord/ChannelWrapper.js';
import {channelSelectMenu} from '../../../util/channels.js';
import colors from '../../../util/colors.js';
import BadWord from '../../../database/BadWord.js';
import Punishment from '../../../database/Punishment.js';

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
                }, {
                    name: 'Send direct message',
                    value: 'DM'
                }
            )
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

        const global = interaction.options.getBoolean('global');
        const type = interaction.options.getString('type');
        const punishment = interaction.options.getString('punishment');
        await this.showModal(interaction, badWord, global, type, punishment);
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(parts[3], interaction.guildId);

        if (!badWord) {
            await interaction.update({
                embeds: [new ErrorEmbed('There is no bad-word with this id.')],
                components: []
            });
            return;
        }

        await this.showModal(interaction, badWord, null, null, null);
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {BadWord} badWord
     * @param {?boolean} global
     * @param {?string} type
     * @param {?string} punishment
     * @return {Promise<void>}
     */
    async showModal(interaction, badWord, global, type, punishment) {
        global ??= badWord.global;
        type ??= badWord.trigger.type;
        punishment ??= badWord.punishment;

        const confirmation = new Confirmation({global, type, id: badWord.id, punishment}, timeAfter('1 hour'));

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
                            .setValue(badWord.trigger.asContentString()),
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
                            .setValue(badWord.response)
                    ),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(true)
                            .setCustomId('priority')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('0')
                            .setLabel('Priority')
                            .setValue(badWord.priority)
                    )
            );

        if (['ban', 'mute'].includes(punishment)) {
            modal.addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new TextInputBuilder()
                            .setRequired(true)
                            .setCustomId('duration')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Punishment duration')
                            .setLabel('duration')
                            .setMinLength(1)
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

        let trigger, response, duration = null, priority;
        for (let component of interaction.components) {
            component = component.components[0];
            if (component.customId === 'trigger') {
                trigger = component.value;
            }
            else if (component.customId === 'response') {
                response = component.value;
            }
            else if (component.customId === 'duration') {
                duration = parseTime(component.value) || null;
            }
            else if (component.customId === 'priority') {
                priority = parseInt(component.value) || 0;
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
            );
        }
        else {
            confirmation.data.trigger = trigger;
            confirmation.data.response = response;
            confirmation.data.duration = duration;
            confirmation.data.priority = priority;
            confirmation.expires = timeAfter('30 min');

            const channels = (await interaction.guild.channels.fetch())
                .map(channel => new ChannelWrapper(channel));

            await interaction.reply({
                ephemeral: true,
                content: 'Select channels for the bad-word',
                components: [
                    /** @type {ActionRowBuilder} */
                    new ActionRowBuilder().addComponents(/** @type {*} */
                        channelSelectMenu(channels, badWord.channels)
                            .setCustomId('noop')
                            .setDisabled(true)
                    ),
                    /** @type {ActionRowBuilder} */
                    new ActionRowBuilder().addComponents(/** @type {*} */
                        channelSelectMenu(channels)
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
     * @param {string} punishment
     * @param {?number} duration
     * @param {number} priority
     * @return {Promise<*>}
     */
    async update(interaction, id, global, channels, type, trigger, response, punishment, duration, priority) {
        const badWord = /** @type {?BadWord} */
            await BadWord.getByID(id, interaction.guildId);

        if (!badWord) {
            await interaction.reply(ErrorEmbed.message('There is no bad-word with this id.'));
            return;
        }

        badWord.global = global;
        badWord.channels = channels;
        const triggerResponse = BadWord.getTrigger(type, trigger);
        if (!triggerResponse.success) {
            return interaction.reply(ErrorEmbed.message(triggerResponse.message));
        }
        badWord.trigger = triggerResponse.trigger;
        badWord.response = response;
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