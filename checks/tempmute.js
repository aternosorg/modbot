const util = require('../lib/util.js');

exports.check = async (database, bot) => {
  let results = await database.queryAll("SELECT * FROM moderations WHERE action = 'mute' AND active = TRUE AND expireTime IS NOT NULL AND expireTime <= ?", [Math.floor(Date.now()/1000)]);
  for (let result of results) {
    try {
      if (bot.guilds.resolve(result.guildid).members.fetch(result.userid)) {
        let member = bot.guilds.resolve(result.guildid).members.fetch(result.userid);
        let guildConfig = await util.getGuildConfig(result.guildid)

        if (member.roles.cache.get(guildConfig.mutedRole)) {
          await member.roles.remove([guildConfig.mutedRole], "Temporary mute completed!");
          await member.send(`You were unmuted in \`${bot.guilds.resolve(result.guildid).name}\`: Temporary mute completed!`);
        }
      }

      let user = await bot.users.fetch(result.userid);
      let insert = await database.queryAll("INSERT INTO moderations (guildid, userid, action, created, reason, active) VALUES (?,?,?,?,?,?)",[result.guildid,result.userid,'unban',Math.floor(Date.now()/1000),"Temporary ban completed!", false]);

      let reason = "Temporary mute finished!"
      await util.logMessageChecks(result.guildid, user, reason, insert.insertId, "Unmute");

      await database.query("UPDATE moderations SET active = FALSE WHERE action = 'mute' AND userid = ? AND guildid = ?",[result.userid,result.guildid]);
    } catch (e) {
      console.error(`Couldn't unmute user ${result.userid} in ${result.guildid}`, e);
    }
  }
}

exports.interval = 30;
