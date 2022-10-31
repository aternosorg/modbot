import Interval from './Interval.js';
import database from '../bot/Database.js';
import bot from '../bot/Bot.js';
import {EmbedBuilder, RESTJSONErrorCodes, userMention} from 'discord.js';
import logger from '../bot/Logger.js';
import GuildWrapper from '../discord/GuildWrapper.js';
import MemberWrapper from '../discord/MemberWrapper.js';
import colors from '../util/colors.js';

export default class UnbanInterval extends Interval {
    getInterval() {
        return 30*1000;
    }

    async run() {
        const reason = 'Temporary ban completed!';
        const client = bot.client;
        for (const result of await database.queryAll('SELECT * FROM moderations WHERE action = \'ban\' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?',
            Math.floor(Date.now()/1000))) {
            const user = await client.users.fetch(result.userid);
            /** @property {number} insertId */
            const unban = await database.queryAll('INSERT INTO moderations (guildid, userid, action, created, reason, active) VALUES (?,?,?,?,?,?)', result.guildid, result.userid, 'unban', Math.floor(Date.now()/1000), reason, false);
            const guild = await GuildWrapper.fetch(result.guildid);

            if (!guild) {
                const wrapper = new GuildWrapper({id: result.guildid});
                await wrapper.deleteData();
            }

            const member = new MemberWrapper(user, guild);

            await database.query('UPDATE moderations SET active = FALSE WHERE action = \'ban\' AND userid = ? AND guildid = ?',result.userid, result.guildid);
            try {
                await member.unban(reason, bot.client.user);
                const embed = new EmbedBuilder()
                    .setColor(colors.GREEN)
                    .setAuthor({name: `Case ${unban.insertId} | Unban | ${user.tag}`, iconURL: user.avatarURL()})
                    .setFooter({text: user.id})
                    .setTimestamp()
                    .addFields(
                        /** @type {any} */ { name: 'User', value: `${userMention(user.id)}`, inline: true},
                        /** @type {any} */ { name: 'Reason', value: reason.substring(0, 512), inline: true}
                    );
                await guild.log({embeds: [embed]});
            }
            catch (e) {
                if (![RESTJSONErrorCodes.UnknownBan].includes(e.code)) {
                    await logger.error(`Failed to unban user ${result.userid} in ${result.guildid}`, e);
                }
            }
        }
    }
}