import StrikeCommand from './StrikeCommand.js';
import {
    ActionRowBuilder,
    ModalBuilder,
    PermissionFlagsBits,
    TextInputBuilder, TextInputStyle
} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import Confirmation from '../../database/Confirmation.js';
import {MODAL_TITLE_LIMIT} from '../../util/apiLimits.js';
import ChannelWrapper from '../../discord/ChannelWrapper.js';
import GuildWrapper from '../../discord/GuildWrapper.js';
import PurgeLogEmbed from '../../embeds/PurgeLogEmbed.js';
import {deferReplyOnce} from '../../util/interaction.js';

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
            interaction.options.getInteger('count'),
            interaction.options.getInteger('limit'),
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {?string} reason
     * @param {?number} count
     * @param {?number} limit
     * @return {Promise<void>}
     */
    async strikePurge(interaction, member, reason, count, limit) {
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
            !await this.preventDuplicateModeration(interaction, member, {reason, count, limit})) {
            return;
        }
        await super.strike(interaction, member, reason, count);


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
            /** @type {Confirmation<{reason: ?string, count: number, user: import('discord.js').Snowflake, limit: number}>}*/
            const data = await Confirmation.get(parts[2]);
            if (!data) {
                await interaction.update({content: 'This confirmation has expired.', embeds: [], components: []});
                return;
            }

            await this.strikePurge(
                interaction,
                await MemberWrapper.getMember(interaction, data.data.user),
                data.data.reason,
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
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        if (!member) {
            return;
        }

        await interaction.showModal(new ModalBuilder()
            .setTitle(`Strike-purge ${await member.displayName()}`.substring(0, MODAL_TITLE_LIMIT))
            .setCustomId(`strike-purge:${member.user.id}`)
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
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Message deletion limit')
                        .setCustomId('limit')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('100')),
            ));
    }

    async executeModal(interaction) {
        let reason, count, limit;
        for (const row of interaction.components) {
            for (const component of row.components) {
                if (component.customId === 'reason') {
                    reason = component.value || 'No reason provided';
                }
                else if (component.customId === 'count') {
                    count = parseInt(component.value);
                }
                else if (component.customId === 'limit') {
                    limit = parseInt(component.value);
                }
            }
        }

        await this.strikePurge(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason,
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