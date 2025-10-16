import Command from '../Command.js';
import {
    LabelBuilder,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder, MessageFlags, channelMention,
} from 'discord.js';
import ChannelWrapper from '../../discord/ChannelWrapper.js';
import ErrorEmbed from '../../formatting/embeds/ErrorEmbed.js';
import {channelSelectMenu} from '../../util/channels.js';
import Confirmation from '../../database/Confirmation.js';
import {timeAfter} from '../../util/timeutils.js';
import ChannelSettings from '../../settings/ChannelSettings.js';

/**
 * @typedef {object} ComponentStrings
 * @property {string} options_global_description
 * @property {string} message_no_channels
 * @property {string} modal_title
 * @property {string} modal_channels_description
 * @property {string} modal_message_description
 * @property {string} message_success
 */

/**
 * @abstract
 */
export default class BaseLockCommand extends Command {
    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageChannels);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageChannels)
            .add(PermissionFlagsBits.ManageRoles);
    }

    buildOptions(builder) {
        builder.addBooleanOption(option => option
            .setName('global')
            .setDescription(this.#getString('options_global_description'))
            .setRequired(false));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const channels = await this.getChannels(interaction);

        if (!channels.length) {
            await interaction.reply(ErrorEmbed.message(this.#getString('message_no_channels')));
            return;
        }

        const modal = new ModalBuilder()
            .setTitle(this.#getString('modal_title'));

        const global = interaction.options.getBoolean('global');
        if (!global) {
            modal.addLabelComponents(
                new LabelBuilder()
                    .setLabel('Channels')
                    .setDescription(this.#getString('modal_channels_description'))
                    .setStringSelectMenuComponent(channelSelectMenu(channels).setCustomId('channels'))
            );
        }

        modal.addLabelComponents(
            new LabelBuilder()
                .setLabel('Lock message')
                .setDescription(this.#getString('modal_message_description'))
                .setTextInputComponent(new TextInputBuilder()
                    .setCustomId('message')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setMaxLength(4000)
                )
        );

        const confirmation = new Confirmation({global}, timeAfter('15 minutes'));
        modal.setCustomId(`${this.getName()}:${await confirmation.save()}`);

        await interaction.showModal(modal);
    }

    async executeModal(interaction) {
        const confirmationId = interaction.customId.split(':')[1];
        const confirmation = await Confirmation.get(confirmationId);

        if (!confirmation) {
            await interaction.reply(ErrorEmbed.message('This confirmation has expired.'));
            return;
        }

        const global = confirmation.data.global;
        /** @type {string[]} */
        let channels = [];
        /** @type {?string} */
        let message = null;
        for (const component of interaction.components) {
            switch (component.component.customId) {
                case 'channels':
                    channels = component.component.values;
                    break;
                case 'message':
                    message = component.component.value || null;
                    break;
            }
        }
        if (global) {
            channels = (await this.getChannels(interaction)).map(c => c.channel.id);
        }

        if (!channels) {
            await interaction.reply(ErrorEmbed.message(this.#getString('message_no_channels')));
            return;
        }

        const everyone = interaction.guild.roles.everyone.id;
        const embed = this.getChannelMessageEmbed(message);

        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        for (const channelId of channels) {
            const channel = /** @type {import('discord.js').TextChannel} */
                await interaction.guild.channels.fetch(channelId);
            const wrapper = new ChannelWrapper(channel);
            const channelSettings = await ChannelSettings.get(channelId);

            await this.performAction(channel, wrapper, channelSettings, everyone, embed);
        }

        await interaction.editReply({
            content: this.#getString("message_success") + channels.map(channelMention),
        });
    }

    /**
     * @param {string} key
     * @returns {string}
     */
    #getString(key) {
        const value = this.getStrings()[key];
        if (!value) {
            throw new Error(`String key "${key}" not found in ${this.constructor.name}`);
        }
        return value;
    }

    /**
     * Get all strings used in the command
     * @abstract
     * @returns {ComponentStrings}
     */
    getStrings() {
        throw new Error('Not implemented');
    }

    /**
     * Get all channels that this command can target
     * @param {import('discord.js').BaseInteraction} interaction
     * @returns {Promise<ChannelWrapper[]>}
     * @abstract
     */
    async getChannels(interaction) {
        throw new Error('Not implemented');
    }

    /**
     * Get the message embed to send in each channel
     * @abstract
     * @param {?string} message Optional message specified by the user
     * @returns {EmbedBuilder}
     */
    getChannelMessageEmbed(message) {
        throw new Error('Not implemented');
    }

    /**
     * Perform the lock or unlock action on a channel
     * @param {import('discord.js').TextChannel} channel
     * @param {ChannelWrapper} wrapper
     * @param {ChannelSettings} channelSettings
     * @param {import('discord.js').Snowflake} everyone
     * @param {EmbedBuilder} embed
     * @returns {Promise<void>}
     */
    async performAction(channel, wrapper, channelSettings, everyone, embed) {

    }
}
