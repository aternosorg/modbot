import EventListener from '../EventListener.js';

/**
 * @abstract
 */
export default class GuildMemberAddEventListener extends EventListener {
    get name() {
        return 'guildMemberAdd';
    }

    /**
     * @abstract
     * @param {GuildMember} member
     * @return {Promise<unknown>}
     */
    async execute(member) {
        member.id;
    }
}