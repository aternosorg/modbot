import SubCommand from '../SubCommand.js';
import Moderation from '../../database/Moderation.js';
import {ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import Database from '../../bot/Database.js';
import {MODAL_TITLE_LIMIT, TEXT_INPUT_LABEL_LIMIT} from '../../util/apiLimits.js';

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
        const moderationCount = (await Moderation.getAll(interaction.guildId, user.id)).length;
        if (moderationCount === 0) {
            await interaction.reply({ephemeral: true, content: 'This user has no moderations.'});
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Delete ${moderationCount} Moderations`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`moderation:clear:${user.id}`)
            .addComponents(/** @type {*} */ new ActionRowBuilder()
                .addComponents(/** @type {*} */ new TextInputBuilder()
                    .setLabel(`Delete moderations for ${user.tag}`.substring(0, TEXT_INPUT_LABEL_LIMIT))
                    .setPlaceholder('Yes')
                    .setCustomId('confirmation')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                )
            )
        );
    }

    async executeModal(interaction) {
        const member = await MemberWrapper.getMemberFromCustomId(interaction, 2);
        const value = interaction.components[0].components[0].value;
        if (value.toLowerCase() !== 'yes') {
            await interaction.reply({
                ephemeral: true,
                content: 'No moderations have been deleted',
            });
            return;
        }

        /** @property {Number} affectedRows */
        const deletion = await Database.instance.queryAll('DELETE FROM moderations WHERE guildid = ? AND userid = ?',
            interaction.guildId, member.user.id);
        await interaction.reply({
            ephemeral: true,
            content: `Deleted ${deletion.affectedRows} ${deletion.affectedRows === 1 ? 'moderation' : 'moderations'}!`
        });
    }

    getDescription() {
        return 'Delete all moderations for a user';
    }

    getName() {
        return 'clear';
    }
}