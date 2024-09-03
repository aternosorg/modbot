import EventListener from '../EventListener.js';
import GuildWrapper from '../../discord/GuildWrapper.js';

export default class GuildDeleteEventListener extends EventListener {
    get name() {
        return 'guildDelete';
    }

    /**
     * @param {import('discord.js').Guild} guild
     * @returns {Promise<Awaited<object|null>[]>}
     */
    async execute(guild) {
        const wrapper = new GuildWrapper(guild);
        await wrapper.deleteData();
    }
}