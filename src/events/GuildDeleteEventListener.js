import EventListener from './EventListener.js';
import GuildWrapper from '../discord/GuildWrapper.js';

export default class GuildDeleteEventListener extends EventListener {
    get name() {
        return 'guildDelete';
    }

    /**
     * @param {import('discord.js').Guild} guild
     * @return {Promise<Awaited<Object|null>[]>}
     */
    async execute(guild) {
        const wrapper = new GuildWrapper(guild);
        await wrapper.deleteData();
    }
}