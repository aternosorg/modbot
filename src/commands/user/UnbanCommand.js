import {PermissionFlagsBits, PermissionsBitField,} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import ErrorEmbed from '../../formatting/embeds/ErrorEmbed.js';
import UserActionEmbed from '../../formatting/embeds/UserActionEmbed.js';
import config from '../../bot/Config.js';
import {deferReplyOnce, replyOrEdit} from '../../util/interaction.js';
import UserCommand from './UserCommand.js';
import ReasonInput from "../../formatting/components/ReasonInput.js";
import CommentInput from "../../formatting/components/CommentInput.js";
import BetterModalBuilder from "../../formatting/components/BetterModalBuilder.js";

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
            await replyOrEdit(interaction, ErrorEmbed.message('This member isn\'t banned!'));
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

        await interaction.showModal(new BetterModalBuilder()
            .setTitle(`Unban ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`unban:${member.user.id}`)
            .addLabelComponent(new ReasonInput(this))
            .addLabelComponent(new CommentInput(this))
        );
    }

    async executeModal(interaction) {
        let reason, comment;
        for (let label of interaction.components) {
            switch (label.component.customId) {
                case 'reason':
                    reason = label.component.value || 'No reason provided';
                    break;
                case 'comment':
                    comment = label.component.value || null;
                    break;
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
