import Command from '../Command.js';
import {
    ActionRowBuilder, channelMention, EmbedBuilder,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import {channelSelectMenu} from '../../util/channels.js';
import colors from '../../util/colors.js';
import ChannelSettings from '../../settings/ChannelSettings.js';
import ChannelWrapper from '../../discord/ChannelWrapper.js';
import Confirmation from '../../database/Confirmation.js';
import {timeAfter} from '../../util/timeutils.js';

export default class UnlockCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageChannels);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageChannels)
            .add(PermissionFlagsBits.ManageRoles);
    }

    async execute(interaction) {
        /** @type {ChannelWrapper[]} */
        const channels = [];

        for (const [id, channel] of (await interaction.guild.channels.fetch()).entries()) {
            const channelSettings = await ChannelSettings.get(id);
            if (Object.keys(channelSettings.lock).length) {
                channels.push(new ChannelWrapper(channel));
            }
        }

        if (!channels.length) {
            await interaction.reply({
                ephemeral: true,
                content: 'There are no locked channels.'
            });
            return;
        }

        await interaction.reply({
            ephemeral: true,
            content: 'Select which channels you want to unlock',
            components: [
                /** @type {ActionRowBuilder} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */
                        channelSelectMenu(channels).setCustomId('unlock')
                    )
            ]
        });
    }

    async executeSelectMenu(interaction) {
        const confirmation = new Confirmation({channels: interaction.values}, timeAfter('15 minutes'));
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Unlock ${interaction.values.length} channels`)
            .setCustomId(`unlock:${await confirmation.save()}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder().addComponents(
                    /** @type {*} */
                    new TextInputBuilder()
                        .setLabel('Unlock message')
                        .setCustomId('message')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false)
                        .setMaxLength(4000)
                )
            ));
    }

    async executeModal(interaction) {
        const confirmationId = interaction.customId.split(':')[1];
        const confirmation = await Confirmation.get(confirmationId);

        if (!confirmation) {
            await interaction.reply({ephemeral: true, content: 'This confirmation has expired.'});
            return;
        }

        const channels = confirmation.data.channels;
        const message = interaction.components[0].components[0].value;
        const everyone = interaction.guild.roles.everyone.id;

        const embed = new EmbedBuilder()
            .setTitle('This channel has been unlocked')
            .setColor(colors.GREEN)
            .setDescription(message || null);

        await interaction.deferReply({ephemeral: true});
        for (const channelId of channels) {
            const channel = /** @type {import('discord.js').TextChannel} */
                await interaction.guild.channels.fetch(channelId);
            const wrapper = new ChannelWrapper(channel);

            const channelSettings = await ChannelSettings.get(channelId);
            await channel.permissionOverwrites.edit(everyone, channelSettings.lock ?? {});
            channelSettings.lock = {};
            await channelSettings.save();

            await wrapper.tryToSend({embeds: [embed]});
        }

        await interaction.editReply({
            content: `Successfully unlocked channels: ${channels.map(channelMention)}`,
        });
    }

    getDescription() {
        return 'Unlock locked channels';
    }

    getName() {
        return 'unlock';
    }
}