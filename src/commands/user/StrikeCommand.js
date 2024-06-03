import {
    ActionRowBuilder,
    bold,
    escapeMarkdown,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import UserCommand from './UserCommand.js';
import Confirmation from '../../database/Confirmation.js';
import {inLimits} from '../../util/util.js';
import EmbedWrapper from '../../embeds/EmbedWrapper.js';
import {formatNumber, inlineEmojiIfExists} from '../../util/format.js';
import {deferReplyOnce, replyOrEdit} from '../../util/interaction.js';

export default class StrikeCommand extends UserCommand {

    /**
     * add options to slash command builder
     * @param {import('discord.js').SlashCommandBuilder} builder
     * @return {import('discord.js').SlashCommandBuilder}
     */
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

    supportsUserCommands() {
        return true;
    }

    async execute(interaction) {
        await this.strike(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
            interaction.options.getString('comment'),
            interaction.options.getInteger('count'),
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?string} comment
     * @param {?number} count
     * @return {Promise<void>}
     */
    async strike(interaction, member, reason, comment, count) {
        await deferReplyOnce(interaction);
        reason = reason || 'No reason provided';
        count = inLimits(count, 1, 100);

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, {reason, comment, count})) {
            return;
        }

        await member.strike(reason, comment, interaction.user, count);
        await replyOrEdit(interaction, new EmbedWrapper()
            .setDescription(inlineEmojiIfExists('strike') +
                `${bold(escapeMarkdown(await member.displayName()))} has received ${formatNumber(count, 'strike')}: ${reason}`)
            .setColor(colors.RED)
            .toMessage()
        );
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<{reason: ?string, comment: ?string, count: number, user: import('discord.js').Snowflake}>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            await this.strike(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
                data.data.comment,
                data.data.count,
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
     * prompt user for strike reason and count
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Strike ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`strike:${member.user.id}`)
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
                        .setLabel('Comment')
                        .setCustomId('comment')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('No internal comment')),
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

        await this.strike(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason,
            comment,
            count
        );
    }

    getDescription() {
        return 'Strike a user and execute a punishment based on the amount of strikes the user currently has.';
    }

    getName() {
        return 'strike';
    }
}