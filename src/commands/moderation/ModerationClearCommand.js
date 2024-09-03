import SubCommand from '../SubCommand.js';
import Moderation from '../../database/Moderation.js';
import {
    ButtonStyle,
    escapeMarkdown,
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import database from '../../bot/Database.js';
import Confirmation from '../../database/Confirmation.js';
import {timeAfter} from '../../util/timeutils.js';
import ConfirmationEmbed from '../../embeds/ConfirmationEmbed.js';

export default class ModerationClearCommand extends SubCommand {

    buildOptions(builder) {
        builder.addUserOption(option => option
            .setName('user')
            .setDescription('The user who\'s moderations you want to delete.')
            .setRequired(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        await interaction.deferReply({ephemeral: true});
        const moderationCount = (await Moderation.getAll(interaction.guildId, user.id)).length;
        if (moderationCount === 0) {
            await interaction.reply({ephemeral: true, content: 'This user has no moderations.'});
            return;
        }

        const confirmation = new Confirmation({user: user.id}, timeAfter('15 minutes'));
        await interaction.editReply(new ConfirmationEmbed('moderation:clear', await confirmation.save(), ButtonStyle.Danger)
            .setDescription(`Delete ${moderationCount} Moderations for ${escapeMarkdown(user.displayName)}?`)
            .toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[2] === 'confirm') {
            /** @type {Confirmation<{user: import('discord.js').Snowflake}>} */
            const confirmation = await Confirmation.get(parts[3]);

            const member = await MemberWrapper.getMember(interaction, confirmation.data.user);

            if (!confirmation) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            /** @property {number} affectedRows */
            const deletion = await database.queryAll('DELETE FROM moderations WHERE guildid = ? AND userid = ?',
                interaction.guildId, member.user.id);
            await interaction.update({
                content: `Deleted ${deletion.affectedRows} ${deletion.affectedRows === 1 ? 'moderation' : 'moderations'}!`,
                embeds: [], components: []
            });
        }
    }

    getDescription() {
        return 'Delete all moderations for a user';
    }

    getName() {
        return 'clear';
    }
}