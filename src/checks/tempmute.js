const Log = require('../Log');
const GuildConfig = require('../config/GuildConfig');
const RateLimiter = require('../discord/RateLimiter.js');
const {Guild, Constants: {APIErrors}} = require('discord.js');
const deleteGuild = require('../features/guildDelete/deleteConfig');
const monitor = require('../Monitor').getInstance();

exports.check = async (database, bot) => {
    let results = await database.queryAll('SELECT * FROM moderations WHERE action = \'mute\' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?', [Math.floor(Date.now()/1000)]);
    for (let result of results) {
        try {
            let member;
            try {
                /** @type {Guild} */
                const guild = await bot.guilds.fetch(result.guildid);
                member = await guild.members.fetch(result.userid);
                if (member) {
                    let guildConfig = await GuildConfig.get(result.guildid);
                    if (member.roles.cache.get(guildConfig.mutedRole)) {
                        await member.roles.remove(guildConfig.mutedRole, 'Temporary mute completed!');
                        await RateLimiter.sendDM(guild ,member, `You were unmuted in \`${bot.guilds.resolve(result.guildid).name}\` | Temporary mute completed!`);
                    }
                }
            }
            catch (e) {
                if (e.code === APIErrors.UNKNOWN_GUILD) {
                    await deleteGuild.delete(database, result.guildid);
                }
                else if (![APIErrors.UNKNOWN_MEMBER, APIErrors.MISSING_PERMISSIONS, APIErrors.CANNOT_MESSAGE_USER].includes(e.code)) {
                    throw e;
                }
            }

            let user = await bot.users.fetch(result.userid);
            let insert = await database.queryAll('INSERT INTO moderations (guildid, userid, action, created, reason, active) VALUES (?,?,?,?,?,?)',[result.guildid,result.userid,'unmute',Math.floor(Date.now()/1000),'Temporary mute completed!', false]);

            let reason = 'Temporary mute finished!';
            await Log.logCheck(result.guildid, user, reason, insert.insertId, 'Unmute');

            await database.query('UPDATE moderations SET active = FALSE WHERE action = \'mute\' AND userid = ? AND guildid = ?',[result.userid,result.guildid]);
        }
        catch (e) {
            await monitor.error('Failed to run tempmute check: ', e, result);
            console.error(`Couldn't unmute user ${result.userid} in ${result.guildid}`, e);
        }
    }
};

exports.interval = 30;
