import Command from '../Command.js';
import {
    ActionRowBuilder, bold, escapeMarkdown,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import {inLimits} from '../../util/util.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import {formatNumber, inlineEmojiIfExists} from '../../util/format.js';
import {deferReplyOnce, replyOrEdit} from '../../util/interaction.js';

export default class PardonCommand extends Command {

    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to pardon')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Pardon reason')
                .setRequired(false)
        );
        builder.addIntegerOption(option =>
            option.setName('count')
                .setDescription('Strike count')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(100)
        );
        return super.buildOptions(builder);
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
        await this.pardon(interaction, member, reason, interaction.user, interaction.options.getInteger('count'));
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {import('discord.js').User} moderator
     * @param {?number} count
     * @return {Promise<void>}
     */
    async pardon(interaction, member, reason, moderator, count) {
        await deferReplyOnce(interaction);
        count = inLimits(count, 1, 100);

        reason = reason || 'No reason provided';
        await member.pardon(reason, moderator, count);
        await replyOrEdit(interaction, new EmbedWrapper()
            .setDescription(inlineEmojiIfExists('pardon') +
                `${formatNumber(count, 'strike')} were pardoned for ${bold(escapeMarkdown(member.user.tag))}: ${reason}`)
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
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Pardon ${member.user.tag}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`pardon:${member.user.id}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Reason')
                        .setCustomId('reason')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('No reason provided')),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Count')
                        .setCustomId('count')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('1')),
            ));
    }

    async executeModal(interaction) {
        let reason, count;
        for (const row of interaction.components) {
            for (const component of row.components) {
                if (component.customId === 'reason') {
                    reason = component.value || 'No reason provided';
                }
                else if (component.customId === 'count') {
                    count = parseInt(component.value);
                }
            }
        }

        await this.pardon(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason, interaction.user, count);
    }

    getDescription() {
        return 'Pardon a strike from a user';
    }

    getName() {
        return 'pardon';
    }
}