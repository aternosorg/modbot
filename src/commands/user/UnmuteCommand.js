import Command from '../Command.js';
import {
    ActionRowBuilder,
    ModalBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import UserActionEmbed from '../../embeds/UserActionEmbed.js';
import Config from '../../bot/Config.js';

export default class UnmuteCommand extends Command {

    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to unmute')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Unmute reason')
                .setRequired(false)
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
        await this.unmute(interaction, member, reason, interaction.user);
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {import('discord.js').User} moderator
     * @return {Promise<void>}
     */
    async unmute(interaction, member, reason, moderator) {
        if (!member) {
            return;
        }

        if (!await member.isMuted()) {
            await interaction.reply(ErrorEmbed.message('This member isn\'t muted!'));
            return;
        }

        reason = reason || 'No reason provided';
        await member.unmute(reason, moderator);
        await interaction.reply(
            new UserActionEmbed(member.user, reason, 'unmuted', colors.GREEN, Config.instance.data.emoji.mute)
                .toMessage());
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
            .setTitle(`Unmute ${member.user.tag}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`unmute:${member.user.id}`)
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Reason')
                        .setCustomId('reason')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('No reason provided')),
            ));
    }

    async executeModal(interaction) {
        const reason = interaction.components[0].components.find(component => component.customId === 'reason').value
            || 'No reason provided';

        await this.unmute(interaction, await MemberWrapper.getMemberFromCustomId(interaction), reason, interaction.user);
    }

    getDescription() {
        return 'Unmute a user';
    }

    getName() {
        return 'unmute';
    }
}