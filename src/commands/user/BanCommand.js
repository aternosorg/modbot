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
import DurationInput from '../../modals/inputs/DurationInput.js';

/**
 * @import {DurationConfirmationData} from './UserCommand.js';
 */

/**
 * @typedef {DurationConfirmationData} BanConfirmationData
 * @property {?number} deleteMessageTime
 */

export default class BanCommand extends UserCommand {

    buildOptions(builder) {
        super.buildOptions(builder);
        builder.addStringOption(option =>
            option.setName('duration')
                .setDescription('Ban duration')
                .setRequired(false)
                .setAutocomplete(true)
        );
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

    supportsUserCommands() {
        return true;
    }

    async execute(interaction) {
        await this.ban(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
            interaction.options.getString('comment'),
            parseTime(interaction.options.getString('duration')),
            parseTime(interaction.options.getString('delete'))
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?string} comment
     * @param {?number} duration
     * @param {?number} deleteMessageTime
     * @returns {Promise<void>}
     */
    async ban(interaction, member, reason, comment, duration, deleteMessageTime) {
        reason = reason || 'No reason provided';
        await deferReplyOnce(interaction);

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, {
                reason,
                comment,
                duration,
                deleteMessageTime
            })) {
            return;
        }

        await member.ban(reason, comment, interaction.user, duration, deleteMessageTime);
        await replyOrEdit(
            interaction,
            new UserActionEmbed(member.user, reason, 'banned', colors.RED, config.data.emoji.ban, duration)
                .toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<BanConfirmationData>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            return await this.ban(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
                data.data.comment,
                data.data.duration,
                data.data.deleteMessageTime,
            );
        }

        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    async executeUserMenu(interaction) {
        const member = new MemberWrapper(interaction.targetUser, interaction.guild);
        await this.promptForData(interaction, member);
    }

    /**
     * prompt user for ban reason, duration and more
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @returns {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Ban ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`ban:${member.user.id}`)
            .addComponents(
                new ReasonInput().toActionRow(),
                new CommentInput().toActionRow(),
                new DurationInput().toActionRow(),
                new DeleteMessageHistoryInput().toActionRow(),
            ));
    }

    async executeModal(interaction) {
        let reason, duration, deleteMessageTime, comment;
        for (const row of interaction.components) {
            for (const component of row.components) {
                switch (component.customId) {
                    case 'reason':
                        reason = component.value || 'No reason provided';
                        break;
                    case 'comment':
                        comment = component.value || null;
                        break;
                    case 'duration':
                        duration = parseTime(component.value);
                        break;
                    case 'delete':
                        deleteMessageTime = parseTime(component.value);
                        break;
                }
            }
        }

        await this.ban(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason,
            comment,
            duration,
            deleteMessageTime
        );
    }

    getDescription() {
        return 'Ban a user';
    }

    getName() {
        return 'ban';
    }
}