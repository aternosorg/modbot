import Command from '../Command.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import Moderation from '../../database/Moderation.js';
import WhereParameter from '../../database/WhereParameter.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    time, TimestampStyles
} from 'discord.js';
import {toTitleCase} from '../../util/util.js';
import {formatTime} from '../../util/timeutils.js';
import UserWrapper from '../../discord/UserWrapper.js';
import LineEmbed from '../../embeds/LineEmbed.js';

/**
 * warn a user if this member has been moderated in the last x seconds
 * @type {number}
 */
const MODERATION_WARN_DURATION = 5 * 60;

/**
 * @abstract
 */
export default class ModerationCommand extends Command {
    /**
     * check if this member can be moderated by this moderator
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @return {Promise<boolean>}
     */
    async checkPermissions(interaction, member) {
        if (!member) {
            return false;
        }

        if (!await member.isModerateable()) {
            await interaction.reply({ephemeral: true, content: 'I can\'t moderate this member!'});
            return false;
        }

        const moderator =  await new MemberWrapper(interaction.user, interaction.guild).fetchMember();
        if (!await member.isModerateableBy(moderator)) {
            await interaction.reply({ephemeral: true, content: 'You can\'t moderate this member!'});
            return false;
        }

        return true;
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @param {[]} data data that will be added in the custom id (command:user:data:confirm)
     * @return {Promise<boolean>} should the punishment be executed now
     */
    async preventDuplicateModeration(interaction, member, data = []) {
        if (interaction.customId && interaction.customId.endsWith(':confirm')) {
            return true;
        }

        const results = await Moderation.select([
            new WhereParameter('guildid', interaction.guildId),
            new WhereParameter('userid', member.user.id),
            new WhereParameter('created', Math.floor(Date.now() / 1000) - MODERATION_WARN_DURATION, '>='),
            new WhereParameter('moderator', interaction.user.id, '!='),
            new WhereParameter('action', ['kick', 'ban', 'mute', 'strike', 'softban'], 'IN')
        ]);

        if (!results.length) {
            return true;
        }

        const embed = new LineEmbed()
            .setAuthor({
                name: `${member.user.tag} has already been moderated in the last ${formatTime(MODERATION_WARN_DURATION)}`,
                iconURL: member.user.avatarURL()
            });

        for (const result of results.slice(-3)) {
            const moderator = await new UserWrapper(result.moderator).fetchUser();
            embed.addLineIf(moderator, 'Moderator', moderator.tag)
                .addLine('Type', toTitleCase(result.action))
                .addLine('Timestamp', time(result.created, TimestampStyles.ShortTime))
                .addLineIf(result.expireTime, 'Duration', formatTime(result.getDuration()))
                .addLineIf(result.value, 'Strikes', result.value)
                .addLine('Reason', result.reason.slice(0, 200))
                .newLine();
        }


        data.unshift(this.getName(), member.user.id);
        data.push('confirm');
        console.log(data.join(':'));
        await interaction.reply({
            ephemeral: true,
            embeds: [embed],
            components: [
                /** @type {ActionRowBuilder} */
                new ActionRowBuilder()
                    .addComponents(
                        /** @type {*} */
                        new ButtonBuilder()
                            .setLabel(`${toTitleCase(this.getName())}`)
                            .setStyle(ButtonStyle.Success)
                            .setCustomId(data.join(':'))
                    )
            ]
        });
        return false;
    }
}