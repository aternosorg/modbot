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
import ChannelWrapper, {CHANNEL_LOCK_PERMISSIONS} from '../../discord/ChannelWrapper.js';
import Confirmation from '../../database/Confirmation.js';
import {timeAfter} from '../../util/timeutils.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';

export default class LockCommand extends Command {

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
            .setDescription('Lock all lockable channels')
            .setRequired(false));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const channels = (await interaction.guild.channels.fetch())
            .map(channel => new ChannelWrapper(channel))
            .filter(channel => channel.isLockable());

        if (!channels.length) {
            await interaction.reply(ErrorEmbed.message('There are no channels to lock.'));
            return;
        }

        if (interaction.options.getBoolean('global')) {
            interaction.values = channels.map(c => c.channel.id);
            await this.executeSelectMenu(interaction);
        }
        else {
            await interaction.reply({
                ephemeral: true,
                content: 'Select which channels you want to lock',
                components: [
                    /** @type {ActionRowBuilder} */
                    new ActionRowBuilder()
                        .addComponents(/** @type {*} */
                            channelSelectMenu(channels).setCustomId('lock')
                        )
                ]
            });
        }
    }

    async executeSelectMenu(interaction) {
        const confirmation = new Confirmation({channels: interaction.values}, timeAfter('15 minutes'));
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Lock ${interaction.values.length} channels`)
            .setCustomId(`lock:${await confirmation.save()}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder().addComponents(
                    /** @type {*} */
                    new TextInputBuilder()
                        .setLabel('Lock message')
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
            await interaction.reply(ErrorEmbed.message('This confirmation has expired.'));
            return;
        }

        const channels = confirmation.data.channels;
        const message = interaction.components[0].components[0].value;
        const everyone = interaction.guild.roles.everyone.id;

        const embed = new EmbedBuilder()
            .setTitle('This channel has been locked')
            .setColor(colors.RED)
            .setDescription(message || null)
            .setFooter({text: 'You are not muted, this channel is locked for everyone. Please don\'t DM people.'});

        await interaction.deferReply({ephemeral: true});
        for (const channelId of channels) {
            const channel = /** @type {import('discord.js').TextChannel|import('discord.js').GuildChannel} */
                await interaction.guild.channels.fetch(channelId);
            const wrapper = new ChannelWrapper(channel);
            if (!wrapper.isLockable())
                continue;
            const channelSettings = await ChannelSettings.get(channelId);

            await wrapper.tryToSend({embeds: [embed]});

            const permissionEditOptions = {};
            for (const permisson of CHANNEL_LOCK_PERMISSIONS) {
                if (!channel.permissionsFor(everyone).has(permisson))
                    continue;

                const overwrite = channel.permissionOverwrites.cache.get(everyone);
                channelSettings.lock[permisson] = !overwrite ? null : overwrite.allow.has(permisson) ? true : null;
                permissionEditOptions[permisson] = false;
            }

            await channel.permissionOverwrites.edit(everyone, permissionEditOptions);
            await channelSettings.save();
        }

        await interaction.editReply({
            content: `Successfully locked channels: ${channels.map(channelMention)}`,
        });
    }

    getDescription() {
        return 'Stop users from sending messages and adding reactions in one or more channels';
    }

    getName() {
        return 'lock';
    }
}