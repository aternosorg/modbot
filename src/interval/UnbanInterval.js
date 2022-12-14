import Interval from './Interval.js';
import database from '../bot/Database.js';
import bot from '../bot/Bot.js';
import GuildWrapper from '../discord/GuildWrapper.js';
import MemberWrapper from '../discord/MemberWrapper.js';

export default class UnbanInterval extends Interval {
    getInterval() {
        return 30*1000;
    }

    async run() {
        for (const result of await database.queryAll('SELECT * FROM moderations WHERE action = \'ban\' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?',
            Math.floor(Date.now()/1000))) {
            const guild = await GuildWrapper.fetch(result.guildid);

            if (!guild) {
                const wrapper = new GuildWrapper({id: result.guildid});
                await wrapper.deleteData();
            }

            const user = await bot.client.users.fetch(result.userid);
            const member = new MemberWrapper(user, guild);
            await member.unban('Temporary ban completed!', bot.client.user);
        }
    }
}