const util = require('../../lib/util');

exports.message = async (guild, user, database) => {
  let result = await database.query("SELECT * FROM moderations WHERE action = 'ban' AND active = TRUE AND userid = ? AND guildid = ?",[user.id,guild.id]);
  if (result) {
    await database.query("DELETE * FROM moderations WHERE action = 'ban' AND active = TRUE AND userid = ? AND guildid = ?",[user.id,guild.id]);
    await util.logMessage(guild, `Deleted ban [${result.id}] because user was unbanned in this guild!`);
  }
}
