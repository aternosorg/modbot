import {
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import UserCommand from './UserCommand.js';
import Confirmation from '../../database/Confirmation.js';
import UserActionEmbed from '../../embeds/UserActionEmbed.js';
import config from '../../bot/Config.js';
import {deferReplyOnce, replyOrEdit} from '../../util/interaction.js';
import ReasonInput from '../../modals/inputs/ReasonInput.js';
import CommentInput from '../../modals/inputs/CommentInput.js';

/**
 * @import {ConfirmationData} from './UserCommand.js';
 */

export default class KickCommand extends UserCommand {

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.KickMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.KickMembers);
    }

    supportsUserCommands() {
        return true;
    }

    async execute(interaction) {
        await this.kick(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
            interaction.options.getString('comment'),
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?string} comment
     * @returns {Promise<void>}
     */
    async kick(interaction, member, reason, comment) {
        await deferReplyOnce(interaction);
        reason = reason || 'No reason provided';

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, {reason, comment})) {
            return;
        }

        await member.kick(reason, comment, interaction.user);
        await replyOrEdit(interaction,
            new UserActionEmbed(member.user, reason, 'kicked', colors.ORANGE, config.data.emoji.kick)
                .toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<ConfirmationData>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            await this.kick(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
                data.data.comment,
            );
            return;
        }

        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    async executeUserMenu(interaction) {
        const member = new MemberWrapper(interaction.targetUser, interaction.guild);
        await this.promptForData(interaction, member);
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @returns {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Kick ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`kick:${member.user.id}`)
            .addComponents(
                new ReasonInput().toActionRow(),
                new CommentInput().toActionRow(),
            ));
    }

    async executeModal(interaction) {
        let reason, comment;
        for (const row of interaction.components) {
            for (const component of row.components) {
                switch (component.customId) {
                    case 'reason':
                        reason = component.value || 'No reason provided';
                        break;
                    case 'comment':
                        comment = component.value || null;
                        break;
                }
            }
        }

        await this.kick(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason, comment);
    }

    getDescription() {
        return 'Kick a user';
    }

    getName() {
        return 'kick';
    }
}