const util = require('../lib/util.js');

exports.check = async (database, bot) => {
  let results = await database.queryAll("SELECT * FROM moderations WHERE action = 'ban' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?", [Math.floor(Date.now()/1000)]);
  for (let result of results) {
    try {
      let user = await bot.users.fetch(result.userid);
      let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, active) VALUES (?,?,?,?,?,?)",[result.guildid,result.userid,'unban',Math.floor(Date.now()/1000),"Temporary ban completed!", false]);
      let reason = "Temporary ban finished!";

      await database.query("UPDATE moderations SET active = FALSE WHERE action = 'ban' AND userid = ? AND guildid = ?",[result.userid,result.guildid]);

      await bot.guilds.resolve(result.guildid).members.unban(result.userid, "Temporary ban completed!");
      await util.logMessageChecks(result.guildid, user, reason, insert.insertId, "Unban");
    } catch (e) {
      console.error(`Couldn't unban user ${result.userid} in ${result.guildid}`, e);
    }
  }
};

exports.interval = 30;
