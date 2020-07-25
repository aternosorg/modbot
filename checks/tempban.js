const util = require('../lib/util.js');

exports.check = async (database, bot) => {
  let results = await database.queryAll("SELECT * FROM activeModerations WHERE action = 'ban' AND timed = TRUE AND value <= ?", [Math.floor(Date.now()/1000)]);
  for (let result of results) {
    try {
      bot.guilds.resolve(result.guildid).members.unban(result.userid, "Temporary ban completed!");

      let user = await bot.users.resolve(result.userid);

      util.log(result.guildid, `Unbanned \`${user.username}#${user.discriminator}\`: Temporary ban completed!`);

      database.query("INSERT INTO inactiveModerations (guildid, userid, action, created, value, reason, moderator) VALUES (?,?,'ban',?,?,?,?)",[result.guildid,result.userid,result.created,result.value,result.reason,result.moderator]);
      database.query("DELETE FROM activeModerations WHERE action = 'ban' AND userid = ? AND guildid = ?",[result.userid,result.guildid]);
    } catch (e) {
      console.error(`Couldn't unban user ${result.userid} in ${result.guildid}`, e);
    }
  }
}

exports.interval = 60;
