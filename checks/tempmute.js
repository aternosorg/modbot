const util = require('../lib/util.js');

exports.check = async (database, bot) => {
  let results = await database.queryAll("SELECT * FROM activeModerations WHERE action = 'mute' AND timed = 1 AND value <= ?", [Math.floor(Date.now()/1000)]);
  for (let result of results) {
    try {
      bot.guilds.resolve(result.guildid).members.resolve(result.userid).roles.remove([await util.mutedRole(result.guildid)], "Temporary mute completed!");

      let user = await bot.users.resolve(result.userid);

      util.log(result.guildid, `Unmuted \`${user.username}#${user.discriminator}\`: Temporary mute completed!`);

      database.query("INSERT INTO inactiveModerations (guildid, userid, action, created, value, reason, moderator) VALUES (?,?,'mute',?,?,?,?)",[result.guildid,result.userid,result.created,result.value,result.reason,result.moderator]);
      database.query("DELETE FROM activeModerations WHERE action = 'mute' AND userid = ? AND guildid = ?",[result.userid,result.guildid]);
    } catch (e) {
      console.error(`Couldn't unmute user ${result.userid} in ${result.guildid}`, e);
    }
  }
}

exports.interval = 60;
