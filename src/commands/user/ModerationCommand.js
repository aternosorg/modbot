import Command from '../Command.js';
import MemberWrapper from '../../discord/MemberWrapper.js';

/**
 * @abstract
 */
export default class ModerationCommand extends Command {
    /**
     * check if this member can be moderated by this moderator
     * @param {import('discord.js').Interaction} interaction
     * @param {?MemberWrapper} member
     * @param {import('discord.js').User} moderator
     * @return {Promise<boolean>}
     */
    async checkPermissions(interaction, member, moderator) {
        if (!member) {
            return false;
        }

        if (!await member.isModerateable()) {
            await interaction.reply({ephemeral: true, content: 'I can\'t moderate this member!'});
            return false;
        }

        if (!await member.isModerateableBy(await new MemberWrapper(moderator, interaction.guild).fetchMember())) {
            await interaction.reply({ephemeral: true, content: 'You can\'t moderate this member!'});
            return false;
        }

        return true;
    }
}