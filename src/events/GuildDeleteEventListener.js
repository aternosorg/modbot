import EventListener from './EventListener.js';
import Database from '../bot/Database.js';

export default class GuildDeleteEventListener extends EventListener {
    get name() {
        return 'guildDelete';
    }

    /**
     * @param {import('discord.js').Guild} guild
     * @return {Promise<Awaited<Object|null>[]>}
     */
    async execute(guild) {
        return Promise.all([
            Database.instance.query('DELETE FROM channels WHERE guildid = ?', guild.id),
            Database.instance.query('DELETE FROM guilds WHERE id = ?', guild.id),
            Database.instance.query('DELETE FROM responses WHERE guildid = ?', guild.id),
            Database.instance.query('DELETE FROM badWords WHERE guildid = ?', guild.id),
            Database.instance.query('DELETE FROM moderations WHERE guildid = ?', guild.id)
        ]);
    }
}