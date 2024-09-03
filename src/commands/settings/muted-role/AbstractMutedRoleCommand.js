import SubCommand from '../../SubCommand.js';
import GuildSettings from '../../../settings/GuildSettings.js';
import ErrorEmbed from '../../../embeds/ErrorEmbed.js';
import {PermissionFlagsBits, PermissionsBitField, roleMention} from 'discord.js';
import GuildWrapper from '../../../discord/GuildWrapper.js';
import database from '../../../bot/Database.js';
import EmbedWrapper from '../../../embeds/EmbedWrapper.js';
import colors from '../../../util/colors.js';

const MUTED_PERMISSIONS = new PermissionsBitField()
    .add(PermissionFlagsBits.SendMessages)
    .add(PermissionFlagsBits.AddReactions)
    .add(PermissionFlagsBits.Speak)
    .add(PermissionFlagsBits.SendMessagesInThreads)
    .add(PermissionFlagsBits.CreatePublicThreads);

const MUTED_PERMISSION_OVERRIDES = {
    SendMessages: false,
    AddReactions: false,
    Speak: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
};

/**
 * @abstract
 */
export default class AbstractMutedRoleCommand extends SubCommand {

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @param {import('discord.js').Role} role
     * @returns {Promise<void>}
     */
    async setMutedRole(interaction, role) {
        if (!role.editable) {
            await interaction.reply(ErrorEmbed.message('I can\'t edit this role.'));
            return;
        }

        await this.updatePermissionOverrides(interaction, role);
        const guildSettings = await GuildSettings.get(interaction.guildId);
        if (await this.transferOldMutes(guildSettings, interaction, role)) {
            return;
        }

        guildSettings.mutedRole = role.id;
        await guildSettings.save();
        await interaction.editReply({
            embeds: [new EmbedWrapper()
                .setDescription(`Set muted role to ${roleMention(role.id)}`)
                .setColor(colors.GREEN)],
            content: ''
        });
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {import('discord.js').Role} role
     * @returns {Promise<void>}
     */
    async updatePermissionOverrides(interaction, role) {
        await interaction.reply({
            ephemeral: true,
            content: 'Updating permission overrides...',
        });

        for (const /** @type {import('discord.js').TextChannel} */ channel of interaction.guild.channels.cache.values()) {
            if (!channel.manageable) {
                continue;
            }
            const perms = channel.permissionsFor(role);
            if (perms && !perms.any(MUTED_PERMISSIONS)) {
                continue;
            }
            await channel.permissionOverwrites.edit(role, MUTED_PERMISSION_OVERRIDES);
        }
    }

    /**
     * @param {GuildSettings} guildSettings
     * @param {import('discord.js').Interaction} interaction
     * @param {import('discord.js').Role} role
     * @returns {Promise<boolean>} has an error occurred
     */
    async transferOldMutes(guildSettings, interaction, role) {
        const guild = new GuildWrapper(interaction.guild);

        if (!guildSettings.mutedRole || guildSettings.mutedRole === role.id) {
            return false;
        }

        const oldRole = await guild.fetchRole(guildSettings.mutedRole);
        await interaction.editReply('Updating currently muted members...');

        if (!oldRole) {
            return false;
        }

        if (!oldRole.editable) {
            await interaction.editReply(ErrorEmbed.message('Can\'t update existing members (old role too high)'));
            return true;
        }

        for (const moderation of await database.queryAll(
            'SELECT userid FROM moderations WHERE active = TRUE AND action = \'mute\' AND guildid = ?',
            interaction.guildId)) {
            const member = await guild.fetchMember(moderation.userid);

            if (member && member.roles.cache.get(oldRole.id)) {
                await Promise.all([
                    member.roles.remove(oldRole),
                    member.roles.add(role)
                ]);
            }
        }
        return false;
    }
}