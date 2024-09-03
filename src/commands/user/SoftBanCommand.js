import {
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import {parseTime} from '../../util/timeutils.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import UserCommand from './UserCommand.js';
import Confirmation from '../../database/Confirmation.js';
import UserActionEmbed from '../../embeds/UserActionEmbed.js';
import config from '../../bot/Config.js';
import {deferReplyOnce, replyOrEdit} from '../../util/interaction.js';
import ReasonInput from '../../modals/inputs/ReasonInput.js';
import CommentInput from '../../modals/inputs/CommentInput.js';
import DeleteMessageHistoryInput from '../../modals/inputs/DeleteMessageHistoryInput.js';

/**
 * @import {ConfirmationData} from './UserCommand.js';
 */

/**
 * @typedef {ConfirmationData} SoftBanConfirmationData
 * @property {?number} deleteMessageTime
 */

export default class SoftBanCommand extends UserCommand {

    buildOptions(builder) {
        super.buildOptions(builder);
        builder.addStringOption(option =>
            option.setName('delete')
                .setDescription('Delete message history for this time frame')
                .setRequired(false)
        );
        return builder;
    }

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.BanMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.BanMembers);
    }

    async execute(interaction) {
        await this.softBan(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
            interaction.options.getString('comment'),
            parseTime(interaction.options.getString('delete'))
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?string} comment
     * @param {?number} deleteMessageTime
     * @returns {Promise<void>}
     */
    async softBan(interaction, member, reason, comment, deleteMessageTime) {
        await deferReplyOnce(interaction);
        reason = reason || 'No reason provided';

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, {reason, comment, deleteMessageTime})) {
            return;
        }

        await member.softban(reason, comment, interaction.user, deleteMessageTime);
        await replyOrEdit(interaction,
            new UserActionEmbed(member.user, reason, 'softbanned', colors.ORANGE, config.data.emoji.kick)
                .toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<SoftBanConfirmationData>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            await this.softBan(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
                data.data.comment,
                data.data.deleteMessageTime,
            );
            return;
        }

        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    /**
     * prompt user for soft-ban reason and more
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @returns {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Soft-ban ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`soft-ban:${member.user.id}`)
            .addComponents(
                new ReasonInput().toActionRow(),
                new CommentInput().toActionRow(),
                new DeleteMessageHistoryInput().toActionRow(),
            ));
    }

    async executeModal(interaction) {
        let reason, comment, deleteMessageTime;
        for (const row of interaction.components) {
            for (const component of row.components) {
                switch (component.customId) {
                    case 'reason':
                        reason = component.value || 'No reason provided';
                        break;
                    case 'comment':
                        comment = component.value || null;
                        break;
                    case 'delete':
                        deleteMessageTime = parseTime(component.value);
                        break;
                }
            }
        }

        await this.softBan(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason,
            comment,
            deleteMessageTime
        );
    }

    getDescription() {
        return 'Ban and immediately unban a user to kick them and delete their messages';
    }

    getName() {
        return 'soft-ban';
    }
}