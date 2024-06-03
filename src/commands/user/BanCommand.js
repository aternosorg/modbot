import {
    ActionRowBuilder,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle
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
            parseTime(interaction.options.getString('duration')),
            parseTime(interaction.options.getString('delete'))
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?number} duration
     * @param {?number} deleteMessageTime
     * @return {Promise<void>}
     */
    async ban(interaction, member, reason, duration, deleteMessageTime) {
        reason = reason || 'No reason provided';
        await deferReplyOnce(interaction);

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, {reason, duration, deleteMessageTime})) {
            return;
        }

        await member.ban(reason, interaction.user, duration, deleteMessageTime);
        await replyOrEdit(
            interaction,
            new UserActionEmbed(member.user, reason, 'banned', colors.RED, config.data.emoji.ban, duration)
                .toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<{reason: ?string, duration: ?number, deleteMessageTime: ?number, user: import('discord.js').Snowflake}>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            return await this.ban(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
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
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Ban ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`ban:${member.user.id}`)
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
                        .setLabel('Duration')
                        .setCustomId('duration')
                        .setStyle(TextInputStyle.Short)),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Delete message history')
                        .setCustomId('delete')
                        .setStyle(TextInputStyle.Short)
                        .setValue('1 hour')),
            ));
    }

    async executeModal(interaction) {
        let reason, duration, deleteMessageTime;
        for (const row of interaction.components) {
            for (const component of row.components) {
                if (component.customId === 'reason') {
                    reason = component.value || 'No reason provided';
                }
                else if (component.customId === 'duration') {
                    duration = parseTime(component.value);
                }
                else if (component.customId === 'delete') {
                    deleteMessageTime = parseTime(component.value);
                }
            }
        }

        await this.ban(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason,
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