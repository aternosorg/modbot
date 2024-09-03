import {
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import UserActionEmbed from '../../embeds/UserActionEmbed.js';
import config from '../../bot/Config.js';
import {deferReplyOnce, replyOrEdit} from '../../util/interaction.js';
import UserCommand from './UserCommand.js';
import ReasonInput from '../../modals/inputs/ReasonInput.js';
import CommentInput from '../../modals/inputs/CommentInput.js';

export default class UnmuteCommand extends UserCommand {
    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ModerateMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.ModerateMembers);
    }

    async execute(interaction) {
        const member = new MemberWrapper(interaction.options.getUser('user', true), interaction.guild);
        const reason = interaction.options.getString('reason');
        const comment = interaction.options.getString('comment');
        await this.unmute(interaction, member, reason, comment, interaction.user);
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?string} comment
     * @param {import('discord.js').User} moderator
     * @returns {Promise<void>}
     */
    async unmute(interaction, member, reason, comment, moderator) {
        if (!member) {
            return;
        }
        await deferReplyOnce(interaction);

        if (!await member.isMuted()) {
            await interaction.reply(ErrorEmbed.message('This member isn\'t muted!'));
            return;
        }

        reason = reason || 'No reason provided';
        await member.unmute(reason, comment, moderator);
        await replyOrEdit(
            interaction,
            new UserActionEmbed(member.user, reason, 'unmuted', colors.GREEN, config.data.emoji.mute)
                .toMessage());
    }

    async executeButton(interaction) {
        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
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
            .setTitle(`Unmute ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`unmute:${member.user.id}`)
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

        await this.unmute(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason, comment, interaction.user);
    }

    getDescription() {
        return 'Unmute a user';
    }

    getName() {
        return 'unmute';
    }
}