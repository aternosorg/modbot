import Interval from './Interval.js';
import Database from '../bot/Database.js';
import Log from '../discord/GuildLog.js';
import Bot from '../bot/Bot.js';
import {RESTJSONErrorCodes} from 'discord.js';
import Logger from '../logging/Logger.js';

export default class UnbanInterval extends Interval {
    getInterval() {
        return 30*1000;
    }

    async run() {
        const reason = 'Temporary ban completed!';
        const client = Bot.instance.client;
        for (const result of await Database.instance.queryAll('SELECT * FROM moderations WHERE action = \'ban\' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?',
            Math.floor(Date.now()/1000))) {
            const user = await client.users.fetch(result.userid);
            const unban = await Database.instance.queryAll('INSERT INTO moderations (guildid, userid, action, created, reason, active) VALUES (?,?,?,?,?,?)', result.guildid, result.userid, 'unban', Math.floor(Date.now()/1000), reason, false);
            await Database.instance.query('UPDATE moderations SET active = FALSE WHERE action = \'ban\' AND userid = ? AND guildid = ?',result.userid, result.guildid);
            try {
                await client.guilds.resolve(result.guildid).members.unban(result.userid, reason);
                await Log.logCheck(result.guildid, user, reason, unban.insertId, 'Unban');
            }
            catch (e) {
                if (![RESTJSONErrorCodes.UnknownBan].includes(e.code)) {
                    await Logger.instance.error(`Failed to unban user ${result.userid} in ${result.guildid}`, e);
                }
            }
        }
    }
}