import Command from '../Command.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import Moderation from '../../database/Moderation.js';
import WhereParameter from '../../database/WhereParameter.js';
import {bold, time, TimestampStyles} from 'discord.js';
import {toTitleCase} from '../../util/format.js';
import {formatTime} from '../../util/timeutils.js';
import UserWrapper from '../../discord/UserWrapper.js';
import Confirmation from '../../database/Confirmation.js';
import ConfirmationEmbed from '../../embeds/ConfirmationEmbed.js';
import ErrorEmbed from '../../embeds/ErrorEmbed.js';
import database from '../../bot/Database.js';
import {replyOrEdit} from '../../util/interaction.js';
import {AUTOCOMPLETE_NAME_LIMIT} from '../../util/apiLimits.js';

/**
 * warn a user if this member has been moderated in the last x seconds
 * @type {number}
 */
const MODERATION_WARN_DURATION = 5 * 60;

/**
 * how long a confirmation should be available for
 * @type {number}
 */
const CONFIRMATION_DURATION = 15 * 60;

/**
 * @abstract
 */
export default class UserCommand extends Command {
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
            await replyOrEdit(interaction, ErrorEmbed.message('I can\'t moderate this member!'));
            return false;
        }

        const moderator =  await new MemberWrapper(interaction.user, interaction.guild).fetchMember();
        if (!await member.isModerateableBy(moderator)) {
            await replyOrEdit(interaction, ErrorEmbed.message('You can\'t moderate this member!'));
            return false;
        }

        return true;
    }

    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @param {Object} data data that will be saved for the confirmation
     * @return {Promise<boolean>} should the punishment be executed now
     */
    async preventDuplicateModeration(interaction, member, data = {}) {
        const customIdParts = (interaction.customId ?? '').split(':');
        if (customIdParts[1] === 'confirm') {
            const confirmationId = parseInt(customIdParts[2]);
            await new Confirmation(null, 0, confirmationId).delete();
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

        data.user = member.user.id;
        const confirmation = new Confirmation(data, Math.floor(Date.now() / 1000) + CONFIRMATION_DURATION);
        const embed = new ConfirmationEmbed(this.getName(), await confirmation.save())
            .setAuthor({
                name: `${await member.displayName()} has already been moderated in the last ${formatTime(MODERATION_WARN_DURATION)}.`,
                iconURL: member.user.avatarURL()
            });

        for (const result of results.slice(-3)) {
            const moderator = await new UserWrapper(result.moderator).fetchUser();
            embed
                .addPairIf(moderator, 'Moderator', moderator.displayName)
                .addPairIf(moderator, 'Moderator ID', moderator.id)
                .addPair('Type', toTitleCase(result.action))
                .addPair('Timestamp', time(result.created, TimestampStyles.ShortTime))
                .addPairIf(result.expireTime, 'Duration', formatTime(result.getDuration()))
                .addPairIf(result.value, 'Strikes', result.value)
                .addPair('Reason', result.reason.slice(0, 200))
                .newLine();
        }

        embed.addLine(bold(`Are you sure you want to ${this.getName()} them?`));

        await replyOrEdit(interaction, embed.toMessage());
        return false;
    }

    async complete(interaction) {
        const focussed = interaction.options.getFocused(true);
        switch (focussed.name) {
            case 'reason': {
                if (focussed.value?.length > AUTOCOMPLETE_NAME_LIMIT) {
                    return [];
                }

                const options = await database.queryAll(
                    'SELECT reason, COUNT(*) AS count FROM (SELECT reason FROM moderations WHERE moderator = ? AND guildid = ? AND action = ? LIMIT 500) AS reasons WHERE reason LIKE CONCAT(\'%\', ?, \'%\') AND LENGTH(reason) <= ? GROUP BY reason ORDER BY count DESC LIMIT 5;',
                    interaction.user.id, interaction.guild.id, this.getName(), focussed.value, AUTOCOMPLETE_NAME_LIMIT);
                if (focussed.value) {
                    options.unshift({reason: focussed.value});
                }
                return options.map(data => ({name: data.reason, value: data.reason}));
            }

            case 'duration':{
                let options = await database.queryAll(
                    'SELECT duration, COUNT(*) AS count FROM (SELECT expireTime - created AS duration FROM moderations WHERE moderator = ? AND guildid = ? AND action = ? AND expireTime IS NOT NULL LIMIT 250) AS durations GROUP BY duration ORDER BY count DESC LIMIT 5;',
                    interaction.user.id, interaction.guild.id, this.getName());
                options = options.map(data => {
                    const duration = formatTime(data.duration);
                    return {name: duration, value: duration};
                });
                if (focussed.value) {
                    options.unshift({name: focussed.value, value: focussed.value});
                }
                return options;
            }
        }

        return super.complete(interaction);
    }
}