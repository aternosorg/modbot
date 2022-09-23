import Command from '../Command.js';
import {
    ActionRowBuilder, channelMention, EmbedBuilder,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import {channelSelectMenu, isLockable, LOCK_PERMISSIONS} from '../../util/channels.js';
import colors from '../../util/colors.js';
import ChannelSettings from '../../settings/ChannelSettings.js';

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

    async execute(interaction) {
        const channels = (await interaction.guild.channels.fetch())
            .filter((channel) => isLockable(channel));

        if (!channels.size) {
            await interaction.reply({
                ephemeral: true,
                content: 'There are no channels to lock.'
            });
            return;
        }

        await interaction.reply({
            ephemeral: true,
            content: 'Select which channels you want to lock',
            components: [
                /** @type {ActionRowBuilder} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */
                        channelSelectMenu(Array.from(channels.values())).setCustomId('lock')
                    )
            ]
        });
    }

    async executeSelectMenu(interaction) {
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Lock ${interaction.values.length} channels`)
            .setCustomId(`lock:${interaction.values.join(':')}`)
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
        const channels = interaction.customId.split(':').slice(1);
        const message = interaction.components[0].components[0].value;
        const everyone = interaction.guild.roles.everyone.id;

        const embed = new EmbedBuilder()
            .setTitle('This channel has been locked')
            .setColor(colors.RED)
            .setDescription(message || null)
            .setFooter({text: 'You are not muted, this channel is locked for everyone. Please don\'t DM people.'});

        await interaction.deferReply({ephemeral: true});
        for (const channelId of channels) {
            const channel = /** @type {import('discord.js').TextChannel} */
                await interaction.guild.channels.fetch(channelId);
            const channelSettings = await ChannelSettings.get(channelId);

            await channel.send({embeds: [embed]});

            const permissionEditOptions = {};
            for (const permisson of LOCK_PERMISSIONS) {
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