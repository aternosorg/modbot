import Interval from './Interval.js';
import database from '../bot/Database.js';
import bot from '../bot/Bot.js';
import {bold, EmbedBuilder, RESTJSONErrorCodes, userMention} from 'discord.js';
import logger from '../Logger.js';
import GuildSettings from '../settings/GuildSettings.js';
import GuildWrapper from '../discord/GuildWrapper.js';
import colors from '../util/colors.js';

export default class UnmuteInterval extends Interval {
    getInterval() {
        return 30*1000;
    }

    async run() {
        const reason = 'Temporary mute completed!';
        const client = bot.client;
        for (const result of await database.queryAll('SELECT * FROM moderations WHERE action = \'mute\' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?',
            Math.floor(Date.now()/1000))) {
            const guild = await GuildWrapper.fetch(result.guildid);

            if (!guild) {
                const wrapper = new GuildWrapper({id: result.guildid});
                await wrapper.deleteData();
            }

            const member = await guild.fetchMember(result.userid);
            if (member) {
                const guildConfig = await GuildSettings.get(result.guildid);
                if (member.roles.cache.get(guildConfig.mutedRole)) {
                    try {
                        await member.roles.remove(guildConfig.mutedRole, reason);
                    }
                    catch (e) {
                        if (e.code !== RESTJSONErrorCodes.MissingPermissions) {
                            await logger.error(`Failed to unmute user ${result.userid} in ${result.guildid}`, e);
                        }
                    }
                    await guild.sendDM(member.user, `You have been unmuted in ${bold(guild.guild.name)} | ${reason}`);
                }
                else if (member.communicationDisabledUntilTimestamp) {
                    await member.disableCommunicationUntil(null);
                    await guild.sendDM(member.user, `You have been unmuted in ${bold(guild.guild.name)} | ${reason}`);
                }
            }

            const user = await client.users.fetch(result.userid);
            /** @property {number} insertId */
            const unmute = await database.queryAll('INSERT INTO moderations (guildid, userid, action, created, reason, active) VALUES (?,?,?,?,?,?)', result.guildid, result.userid, 'unmute', Math.floor(Date.now()/1000), reason, false);
            await database.query('UPDATE moderations SET active = FALSE WHERE action = \'mute\' AND userid = ? AND guildid = ?',result.userid, result.guildid);

            const embed = new EmbedBuilder()
                .setColor(colors.GREEN)
                .setAuthor({name: `Case ${unmute.insertId} | Unmute | ${user.tag}`, iconURL: user.avatarURL()})
                .setFooter({text: user.id})
                .setTimestamp()
                .addFields(
                    /** @type {any} */ { name: 'User', value: `${userMention(user.id)}`, inline: true},
                    /** @type {any} */ { name: 'Reason', value: reason.substring(0, 512), inline: true}
                );
            await guild.log({embeds: [embed]});
        }
    }
}