import SubCommand from '../SubCommand.js';
import Moderation from '../../database/Moderation.js';
import ModerationListEmbed from '../../embeds/ModerationListEmbed.js';
import {formatTime} from '../../util/timeutils.js';
import {EMBED_FIELD_LIMIT, EMBED_TOTAL_LIMIT} from '../../util/apiLimits.js';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, time, TimestampStyles} from 'discord.js';
import Config from '../../bot/Config.js';
import icons from '../../util/icons.js';
import MemberWrapper from '../../discord/MemberWrapper.js';

/**
 * number of moderations that will be displayed on a single page
 * keep embed length limitations in mind when changing this number!
 * @type {number}
 */
const MODERATIONS_PER_PAGE = 20;

export default class ModerationListCommand extends SubCommand {
    buildOptions(builder) {
        builder.addUserOption(option => option
            .setName('user')
            .setDescription('The user who\'s moderations you want to show.')
            .setRequired(true)
        );
        return super.buildOptions(builder);
    }

    async execute(interaction) {
        const user = interaction.options.getUser('user', true);
        const moderations = await Moderation.getAll(interaction.guildId, user.id);

        await interaction.reply(await this.generateMessage(user, moderations));
    }

    async executeButton(interaction) {
        const member = await MemberWrapper.getMemberFromCustomId(interaction, 2);
        if (!member) {
            return;
        }
        const moderations = await Moderation.getAll(interaction.guildId, member.user.id);

        const match = interaction.customId.match(/^[^:]+:[^:]+:[^:]+:(\d+|last|first)$/);
        let page = 1;
        if (match) {
            if (match[1] === 'last') {
                page = Math.ceil(moderations.length / MODERATIONS_PER_PAGE);
            }
            else if (match[1] === 'first') {
                page = 1;
            }
            else {
                page = parseInt(match[1]);
            }
        }
        await interaction.update(await this.generateMessage(member.user, moderations, page));
    }

    /**
     * @param {import('discord.js').User} user
     * @param {Moderation[]} moderations
     * @param {number} page
     * @return {Promise<{ephemeral: boolean, embeds: ModerationListEmbed[]}>}
     */
    async generateMessage(user, moderations, page = 1) {
        const lastPage = Math.ceil(moderations.length / MODERATIONS_PER_PAGE);
        if (page < 1) {
            page = 1;
        }
        else if (page > lastPage) {
            page = lastPage;
        }

        if (!moderations.length) {
            return {
                ephemeral: true,
                embeds: [
                    new ModerationListEmbed(user)
                        .setDescription('This user has no moderations.')
                ]
            };
        }
        const embed = new ModerationListEmbed(user);

        const start = (page - 1) * MODERATIONS_PER_PAGE;
        const end = Math.min(page * MODERATIONS_PER_PAGE, moderations.length);

        for (const moderation of moderations.slice(start, end)) {
            const lines = [];

            if (moderation.action === 'strike') {
                lines.push(`Strikes: ${moderation.value}`);
            }
            else if (moderation.action === 'pardon') {
                lines.push(`Pardoned Strikes: ${-moderation.value}`);
            }

            if (moderation.expireTime) {
                lines.push(`Duration: ${formatTime(moderation.expireTime - moderation.created)}`);
            }

            if (moderation.moderator) {
                lines.push(`Moderator: <@!${moderation.moderator}>`);
            }

            const limit = Math.min(
                EMBED_TOTAL_LIMIT / MODERATIONS_PER_PAGE - lines.join('\n').length,
                EMBED_FIELD_LIMIT
            );
            const reason = moderation.reason.length < limit ? moderation.reason
                : moderation.reason.slice(0, limit - 3) + '...';
            lines.push(`Reason: ${reason}`);

            embed.addFields(/** @type {*} */{
                name: `${moderation.action.toUpperCase()} [#${moderation.id}] ${time(moderation.created, TimestampStyles.LongDate)}`,
                value: lines.join('\n'),
            });
        }

        /** @type {ActionRowBuilder<ButtonBuilder>} */
        const actionRow = new ActionRowBuilder();
        for (const data of [
            { id: `moderation:list:${user.id}:first`, emoji: 'first-page', label: icons.first, disabled: page === 1 },
            { id: `moderation:list:${user.id}:${page - 1}`, emoji: 'previous-page', label: icons.left, disabled: page === 1 },
            { id: `moderation:list:${user.id}:${page + 1}`, emoji: 'next-page', label: icons.right, disabled: page === lastPage },
            { id: `moderation:list:${user.id}:last`, emoji: 'last-page', label: icons.last, disabled: page === lastPage },
        ]) {
            const button = new ButtonBuilder()
                .setCustomId(data.id)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(data.disabled ?? false);

            const emoji = Config.instance.data.emoji[data.emoji] ?? null;
            if (emoji) {
                button.setEmoji(emoji);
            }
            else {
                button.setLabel(data.label);
            }

            actionRow.addComponents(/** @type {*} */ button);
        }


        return { ephemeral: true, embeds: [embed], components: [actionRow] };
    }

    getDescription() {
        return 'Show all moderations for a user';
    }

    getName() {
        return 'list';
    }
}