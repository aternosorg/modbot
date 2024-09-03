import EventListener from '../../EventListener.js';

/**
 * @abstract
 */
export default class GuildMemberAddEventListener extends EventListener {
    get name() {
        return 'guildMemberAdd';
    }

    /**
     * @abstract
     * @param {import('discord.js').GuildMember} member
     * @returns {Promise<unknown>}
     */
    async execute(member) {
        member.id;
    }
}