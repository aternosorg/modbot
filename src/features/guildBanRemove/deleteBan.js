const util = require('../../util');
const Log = require('../../Log');

exports.event = async (options, guild, user) => {
  let result = await options.database.query("SELECT * FROM moderations WHERE action = 'ban' AND active = TRUE AND userid = ? AND guildid = ?",[user.id,guild.id]);
  if (result) {
    await options.database.query("UPDATE moderations SET active = FALSE WHERE action = 'ban' AND active = TRUE AND userid = ? AND guildid = ?",[user.id,guild.id]);
    const embed = {
      title: `Ban deleted from guild | ${util.escapeFormatting(user.tag)}`,
      fields: [
        {name: 'Ban ID', value: result.id}
      ],
      footer: {text:`ID: ${user.id}`}
    }
    if (result.expireTime) {
      let remaining = result.expireTime - Math.floor(Date.now()/1000);
      embed.fields.push({name: 'Remaining timer', value: util.secToTime(remaining)});
    }
    await Log.logEmbed(guild, embed);
  }
};
