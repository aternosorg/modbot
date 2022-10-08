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
import Config from '../../bot/Config.js';

export default class SoftBanCommand extends UserCommand {

    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to soft-ban')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Soft-ban reason')
                .setRequired(false)
        );
        builder.addStringOption(option =>
            option.setName('delete')
                .setDescription('Delete message history for this time frame')
                .setRequired(false)
        );
        return super.buildOptions(builder);
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
            parseTime(interaction.options.getString('delete'))
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?number} deleteMessageTime
     * @return {Promise<void>}
     */
    async softBan(interaction, member, reason, deleteMessageTime) {
        reason = reason || 'No reason provided';

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, {reason, deleteMessageTime})) {
            return;
        }

        await member.softban(reason, interaction.user, deleteMessageTime);
        await interaction.reply(
            new UserActionEmbed(member.user, reason, 'softbanned', colors.ORANGE, Config.instance.data.emoji.kick)
                .toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<{reason: ?string, user: import('discord.js').Snowflake, deleteMessageTime: ?number}>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            await this.softBan(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
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
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Soft-ban ${member.user.tag}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`soft-ban:${member.user.id}`)
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
                        .setLabel('Delete message history')
                        .setCustomId('delete')
                        .setStyle(TextInputStyle.Short)
                        .setValue('1 hour')),
            ));
    }

    async executeModal(interaction) {
        let reason, deleteMessageTime;
        for (const row of interaction.components) {
            for (const component of row.components) {
                if (component.customId === 'reason') {
                    reason = component.value || 'No reason provided';
                }
                else if (component.customId === 'delete') {
                    deleteMessageTime = parseTime(component.value);
                }
            }
        }

        await this.softBan(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason,
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