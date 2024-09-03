import StrikeCommand from './StrikeCommand.js';
import {
    ModalBuilder,
    PermissionFlagsBits,
    TextInputStyle
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import Confirmation from '../../database/Confirmation.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import ChannelWrapper from '../../discord/ChannelWrapper.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import PurgeLogEmbed from '../../embeds/PurgeLogEmbed.js';
import {deferReplyOnce} from '../../util/interaction.js';
import ReasonInput from '../../modals/inputs/ReasonInput.js';
import CommentInput from '../../modals/inputs/CommentInput.js';
import CountInput from '../../modals/inputs/CountInput.js';
import TextInput from '../../modals/inputs/TextInput.js';

/**
 * @import {StrikeConfirmationData} from './StrikeCommand.js';
 */

/**
 * @typedef {StrikeConfirmationData} StrikePurgeConfirmationData
 * @property {number} limit
 */

export default class StrikePurgeCommand extends StrikeCommand {
    buildOptions(builder) {
        super.buildOptions(builder);
        builder.addIntegerOption(option => option
            .setName('limit')
            .setDescription('Delete messages sent by this user in the last x messages (default: 100)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(1000));
        return builder;
    }

    getDefaultMemberPermissions() {
        return super.getDefaultMemberPermissions()
            .add(PermissionFlagsBits.ManageMessages);
    }

    getRequiredBotPermissions() {
        return super.getDefaultMemberPermissions()
            .add(PermissionFlagsBits.ManageMessages);
    }

    supportsUserCommands() {
        return false;
    }

    async execute(interaction) {
        await this.strikePurge(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
            interaction.options.getString('comment'),
            interaction.options.getInteger('count'),
            interaction.options.getInteger('limit'),
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?string} comment
     * @param {?number} count
     * @param {?number} limit
     * @returns {Promise<void>}
     */
    async strikePurge(interaction, member, reason, comment, count, limit) {
        await deferReplyOnce(interaction);
        reason = reason || 'No reason provided';

        if (!count || count < 1) {
            count = 1;
        }

        limit ??= 100;
        if (limit > 1000) {
            limit = 1000;
        }

        if (!await this.checkPermissions(interaction, member) ||
            !await this.preventDuplicateModeration(interaction, member, {reason, comment, count, limit})) {
            return;
        }
        await super.strike(interaction, member, reason, comment, count);


        const channel = new ChannelWrapper(/** @type {import('discord.js').GuildChannel}*/ interaction.channel);
        const messages = (await channel.getMessages(limit))
            .filter(message => message.author.id === member.user.id);

        if (messages.size) {
            await channel.bulkDelete(Array.from(messages.keys()));
        }

        await (new GuildWrapper(interaction.guild))
            .log(new PurgeLogEmbed(
                interaction,
                messages.size,
                limit,
                member.user
            ).toMessage());
    }

    async executeButton(interaction) {
        const parts = interaction.customId.split(':');
        if (parts[1] === 'confirm') {
            /** @type {Confirmation<StrikePurgeConfirmationData>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            await this.strikePurge(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
                data.data.comment,
                data.data.count,
                data.data.limit,
            );
            return;
        }

        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    /**
     * prompt user for strike reason, count and message test limit
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @returns {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Strike-purge ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`strike-purge:${member.user.id}`)
            .addComponents(
                new ReasonInput().toActionRow(),
                new CommentInput().toActionRow(),
                new CountInput().toActionRow(),
                new TextInput().setRequired(false)
                    .setLabel('Message deletion limit')
                    .setCustomId('limit')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('100')
                    .toActionRow(),
            ));
    }

    async executeModal(interaction) {
        let reason, comment, count, limit;
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
                    case 'limit':
                        limit = parseInt(component.value);
                        break;
                }
            }
        }

        await this.strikePurge(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason,
            comment,
            count,
            limit
        );
    }

    getDescription() {
        return 'Strike a user and delete their messages in this channel';
    }

    getName() {
        return 'strike-purge';
    }
}