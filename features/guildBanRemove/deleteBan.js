const util = require('../../lib/util');

exports.event = async (options, guild, user) => {
  let result = await options.database.query("SELECT * FROM moderations WHERE action = 'ban' AND active = TRUE AND userid = ? AND guildid = ?",[user.id,guild.id]);
  if (result) {
    await options.database.query("UPDATE moderations SET active = FALSE WHERE action = 'ban' AND active = TRUE AND userid = ? AND guildid = ?",[user.id,guild.id]);
    if (result.expireTime) {
      let remaining = result.expireTime - Math.floor(Date.now()/1000);
      await util.logMessageEmbed(guild, '', {
        title: `Ban deleted from guild | ${user.username}#${user.discriminator}`,
        fields: [
          {name: 'Ban ID', value: result.id},
          {name: 'Remaining timer', value: util.secToTime(remaining)}
        ],
        footer: {text:`ID: ${user.id}`}
      });
    }
    else {
      await util.logMessageEmbed(guild, '', {
        title: `Ban deleted from guild | ${user.username}#${user.discriminator}`,
        fields: [
          {name: 'Ban ID', value: result.id}
        ],
        footer: {text:`ID: ${user.id}`}
      });
    }
  }
};
