import Command from '../Command.js';
import {formatTime, parseTime, timeAfter} from '../../util/timeutils.js';
import Confirmation from '../../database/Confirmation.js';
import ConfirmationEmbed from '../../embeds/ConfirmationEmbed.js';
import {ButtonStyle, PermissionFlagsBits, PermissionsBitField, RESTJSONErrorCodes} from 'discord.js';
import config from '../../bot/Config.js';

export default class PurgeInvitesCommand extends Command {

    getDefaultMemberPermissions() {
        return new PermissionsBitField();
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ManageGuild);
    }

    buildOptions(builder) {
        builder.addStringOption(option => option
            .setName('minimum-age')
            .setDescription('Only delete invites older than this (default: 1 Month)')
            .setRequired(false));
        builder.addIntegerOption(option => option
            .setName('max-uses')
            .setDescription('Only delete invites with up to this many uses (default: 10)')
            .setMinValue(0)
            .setMaxValue(1000));
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});
        const minAge = parseTime(interaction.options.getString('minimum-age')) ?? parseTime('30d');
        const maxDate = Date.now() - (minAge * 1000);
        const maxUses = interaction.options.getInteger('max-uses') ?? 10;

        const invites = (await interaction.guild.invites.fetch({cache: false}))
            .filter(invite => invite.createdTimestamp < maxDate && invite.uses <= maxUses);

        if (invites.size === 0) {
            await interaction.editReply('No invites matched your filters.');
            return;
        }

        const confirmation = new Confirmation({invites: invites.map(i => i.code)}, timeAfter('15 minutes'));
        await interaction.editReply(new ConfirmationEmbed(this.getName(), await confirmation.save(), ButtonStyle.Danger)
            .setDescription(`Delete ${invites.size} invites older than ${formatTime(minAge)} with less than ${maxUses} uses`)
            .toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<{invites: string[]}>} */
            const confirmation = await Confirmation.get(parts[2]);

            if (!confirmation) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            await interaction.update({
                content: `Deleting ${confirmation.data.invites.length} invites...`,
                embeds: [], components: []
            });

            for (const code of confirmation.data.invites) {
                try {
                    await interaction.guild.invites.delete(code);
                }
                catch (e) {
                    if (e.code !== RESTJSONErrorCodes.UnknownInvite) {
                        throw e;
                    }
                }
            }

            await interaction.editReply(`Deleted ${confirmation.data.invites.length} invites!`);
        }
    }

    isAvailableInAllGuilds() {
        return false;
    }

    async isAvailableIn(guild) {
        return config.data.featureWhitelist.includes(guild.id);
    }

    getDescription() {
        return 'Delete old and unused invites';
    }

    getName() {
        return 'purge-invites';
    }
}