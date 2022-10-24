import Interval from './Interval.js';
import database from '../bot/Database.js';
import GuildWrapper from '../discord/GuildWrapper.js';
import MemberWrapper from '../discord/MemberWrapper.js';
import {PermissionFlagsBits} from 'discord.js';
import {TIMEOUT_DURATION_LIMIT} from '../util/apiLimits.js';
import UserWrapper from '../discord/UserWrapper.js';
import GuildSettings from '../settings/GuildSettings.js';

export default class TransferMuteToTimeoutInterval extends Interval {

    getInterval() {
        return 60 * 60 * 1000;
    }

    async run() {
        for (const result of await database.queryAll('SELECT * FROM moderations WHERE action = \'mute\' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?',
            Math.floor(Date.now() / 1000) + TIMEOUT_DURATION_LIMIT)) {
            const guild = await GuildWrapper.fetch(result.guildid),
                me = await guild.guild.members.fetchMe();
            if (!me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                continue;
            }

            const user = await (new UserWrapper(result.userid)).fetchUser();
            if (!user) {
                continue;
            }

            const member = await (new MemberWrapper(user, guild)).fetchMember();
            const guildSettings = await GuildSettings.get(guild.guild.id);
            if (!member || !member.roles.cache.has(guildSettings.mutedRole)) {
                continue;
            }

            await member.disableCommunicationUntil(parseInt(result.expireTime) * 1000);
            await member.roles.remove(guildSettings.mutedRole);
        }
    }
}