import {
    bold, escapeMarkdown,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import {inLimits} from '../../util/util.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import {formatNumber, inlineEmojiIfExists} from '../../util/format.js';
import {deferReplyOnce, replyOrEdit} from '../../util/interaction.js';
import UserCommand from './UserCommand.js';
import ReasonInput from '../../modals/inputs/ReasonInput.js';
import CommentInput from '../../modals/inputs/CommentInput.js';
import CountInput from '../../modals/inputs/CountInput.js';

export default class PardonCommand extends UserCommand {

    buildOptions(builder) {
        super.buildOptions(builder);
        builder.addIntegerOption(option =>
            option.setName('count')
                .setDescription('Strike count')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100)
        );
        return builder;
    }

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
        await this.pardon(interaction, member, reason, comment, interaction.user, interaction.options.getInteger('count'));
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?string} comment
     * @param {import('discord.js').User} moderator
     * @param {?number} count
     * @returns {Promise<void>}
     */
    async pardon(interaction, member, reason, comment, moderator, count) {
        await deferReplyOnce(interaction);
        count = inLimits(count, 1, 100);
        count = Math.min(count, await member.getStrikeSum());

        if (count === 0) {
            await replyOrEdit(interaction, new EmbedWrapper()
                .setDescription(inlineEmojiIfExists('pardon') +
                    `${bold(escapeMarkdown(await member.displayName()))} has no strikes to pardon`)
                .setColor(colors.RED)
                .toMessage()
            );
            return;
        }

        reason = reason || 'No reason provided';
        await member.pardon(reason, comment, moderator, count);
        await replyOrEdit(interaction, new EmbedWrapper()
            .setDescription(inlineEmojiIfExists('pardon') +
                `${formatNumber(count, 'strike')} were pardoned for ${bold(escapeMarkdown(await member.displayName()))}: ${reason}`)
            .setColor(colors.GREEN)
            .toMessage()
        );
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
            .setTitle(`Pardon ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`pardon:${member.user.id}`)
            .addComponents(
                new ReasonInput().toActionRow(),
                new CommentInput().toActionRow(),
                new CountInput().toActionRow(),
            ));
    }

    async executeModal(interaction) {
        let reason, comment, count;
        for (const row of interaction.components) {
            for (const component of row.components) {
                switch (component.customId) {
                    case 'reason':
                        reason = component.value || 'No reason provided';
                        break;
                    case 'comment':
                        comment = component.value || null;
                        break;
                    case 'count':
                        count = parseInt(component.value);
                        break;
                }
            }
        }

        await this.pardon(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason, comment, interaction.user, count);
    }

    getDescription() {
        return 'Pardon a strike from a user';
    }

    getName() {
        return 'pardon';
    }
}