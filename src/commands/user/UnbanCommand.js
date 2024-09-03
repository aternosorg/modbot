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

export default class UnbanCommand extends UserCommand {
    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.BanMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.BanMembers);
    }

    async execute(interaction) {
        const member = new MemberWrapper(interaction.options.getUser('user', true), interaction.guild);
        const reason = interaction.options.getString('reason');
        const comment = interaction.options.getString('comment');
        await this.unban(interaction, member, reason, comment, interaction.user);
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
    async unban(interaction, member, reason, comment, moderator) {
        if (!member) {
            return;
        }
        await deferReplyOnce(interaction);

        if (!await member.isBanned()) {
            await interaction.reply(ErrorEmbed.message('This member isn\'t banned!'));
            return;
        }

        reason = reason || 'No reason provided';
        await member.unban(reason, comment, moderator);
        await replyOrEdit(
            interaction,
            new UserActionEmbed(member.user, reason, 'unbanned', colors.GREEN, config.data.emoji.ban)
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
            .setTitle(`Unban ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`unban:${member.user.id}`)
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

        await this.unban(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason, comment, interaction.user);
    }

    getDescription() {
        return 'Unban a user';
    }

    getName() {
        return 'unban';
    }
}