import Interval from './Interval.js';
import Database from '../bot/Database.js';
import Log from '../discord/GuildLog.js';
import Bot from '../bot/Bot.js';
import {RESTJSONErrorCodes} from 'discord.js';
import Logger from '../logging/Logger.js';
import GuildConfig from '../config/GuildConfig.js';
import GuildWrapper from '../discord/GuildWrapper.js';
import deleteGuild from '../features/guildDelete/deleteConfig.js';

export default class UnmuteInterval extends Interval {
    getInterval() {
        return 30*1000;
    }

    async run() {
        const reason = 'Temporary mute completed!';
        const client = Bot.instance.client;
        for (const result of await Database.instance.queryAll('SELECT * FROM moderations WHERE action = \'mute\' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?',
            Math.floor(Date.now()/1000))) {
            const guild = await GuildWrapper.fetch(result.guildid);

            if (!guild) {
                // TODO: refactor
                await deleteGuild.delete(Database.instance, result.guildid);
            }

            const member = await guild.fetchMember(result.userid);
            if (member) {
                const guildConfig = await GuildConfig.get(result.guildid);
                if (member.roles.cache.get(guildConfig.mutedRole)) {
                    try {
                        await member.roles.remove(guildConfig.mutedRole, reason);
                    }
                    catch (e) {
                        if (e.code !== RESTJSONErrorCodes.MissingPermissions) {
                            await Logger.instance.error(`Failed to unmute user ${result.userid} in ${result.guildid}`, e);
                        }
                    }
                    await guild.sendDM(member.user, `You have been unmuted in \`${guild.guild.name}\` | ${reason}`);
                }
            }

            const user = await client.users.fetch(result.userid);
            const unmute = await Database.instance.queryAll('INSERT INTO moderations (guildid, userid, action, created, reason, active) VALUES (?,?,?,?,?,?)', result.guildid, result.userid, 'unmute', Math.floor(Date.now()/1000), reason, false);
            await Database.instance.query('UPDATE moderations SET active = FALSE WHERE action = \'mute\' AND userid = ? AND guildid = ?',result.userid, result.guildid);
            await Log.logCheck(result.guildid, user, reason, unmute.insertId, 'Unmute');
        }
    }
}