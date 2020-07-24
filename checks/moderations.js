const util = require('../lib/util.js');

exports.check = async (database, bot) => {
  let results = await database.queryAll("SELECT * FROM moderations WHERE action = 'ban' AND value != 0 AND value <= ?", [Math.floor(Date.now()/1000)]);
  for (let result of results) {
    try {
      bot.guilds.resolve(result.guildid).members.unban(result.userid, "Temporary ban completed!");

      let user = await bot.users.fetch(result.userid);

      util.log({guild:{id:result.guildid}}, `Unbanned \`${user.username}#${user.discriminator}\`: Temporary ban completed!`);
    } catch (e) {
      console.error(`Couldn't unban user ${result.userid} in ${result.guildid}`, e);
    }
  }
}

exports.interval = 60;
