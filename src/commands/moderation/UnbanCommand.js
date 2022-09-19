import Command from '../Command.js';
import {ActionRowBuilder, EmbedBuilder, escapeMarkdown, ModalBuilder, PermissionFlagsBits, PermissionsBitField, TextInputBuilder, TextInputStyle} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import colors from '../../util/colors.js';
import UserWrapper from '../../discord/UserWrapper.js';

export default class UnbanCommand extends Command {

    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to unban')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Unban reason')
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

    supportsUserCommands() {
        return true;
    }

    async execute(interaction) {
        const member = new MemberWrapper(interaction.options.getUser('user', true), interaction.guild);
        const reason = interaction.options.getString('reason');
        await this.unban(interaction, member, reason, interaction.user);
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @param {?string} reason
     * @param {import('discord.js').User} moderator
     * @return {Promise<void>}
     */
    async unban(interaction, member, reason, moderator) {
        reason = reason || 'No reason provided';
        await member.unban(reason, moderator);
        await interaction.reply({
            ephemeral: true,
            embeds: [new EmbedBuilder()
                .setDescription(`${escapeMarkdown(member.user.tag)} has been unbanned: ${reason}`)
                .setColor(colors.GREEN)
            ]}
        );
    }

    async executeButton(interaction) {
        const match = await interaction.customId.match(/^[^:]+:(\d+)$/);
        if (!match) {
            await interaction.reply({ephemeral: true, content: 'Unknown action!'});
            return;
        }

        const user = await (new UserWrapper(match[1])).fetchUser();
        if (!user) {
            await interaction.reply({ephemeral: true, content:'Unknown user!'});
            return;
        }
        const member = new MemberWrapper(user, interaction.guild);
        await this.promptAndUnban(interaction, member);
    }

    async executeUserMenu(interaction) {
        const member = new MemberWrapper(interaction.targetUser, interaction.guild);
        await this.promptAndUnban(interaction, member);
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @return {Promise<void>}
     */
    async promptAndUnban(interaction, member) {
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Unban ${member.user.tag}`)
            .setCustomId('unban')
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

        /** @type {import('discord.js').ModalSubmitInteraction}*/
        let modal = null;
        try {
            modal = await interaction.awaitModalSubmit({
                time: 5 * 60 * 1000
            });
        }
        catch (e) {
            if (e.code === 'InteractionCollectorError') {
                return;
            }
            else {
                throw e;
            }
        }

        const reason = modal.components[0].components.find(component => component.customId === 'reason').value
            || 'No reason provided';

        await this.unban(modal, member, reason, interaction.user);
    }

    getDescription() {
        return 'Unban a user';
    }

    getName() {
        return 'unban';
    }
}