const util = require('../lib/util.js');

exports.check = async (database, bot) => {

  let channelIds = await database.queryAll("SELECT DISTINCT id FROM channels");

  for (let channelId of channelIds) {
    let channel = await util.getChannelConfig(channelId.id);
    let relevant = Math.floor(Date.now() / 1000) - (isNaN(channel.cooldown) ? 0 : channel.cooldown);
    await database.query("DELETE FROM servers WHERE channelid = ? AND timestamp <= ?", [channel.id, relevant]);
  }
  //stats on servers size
  let result = await database.query("SELECT COUNT(*) as c FROM servers");
  let date = new Date();
  console.log(`[${date.getUTCHours()}:${date.getUTCMinutes()}] There are currently ${result['c']} servers in the Database!`);
}

exports.interval = 60;
