const util = require('../../lib/util');

exports.message = async (member, database) => {
  let result = await database.query("SELECT * FROM moderations WHERE action = 'mute' AND active = TRUE AND userid = ? AND guildid = ?",[member.id,member.guild.id])
  if (result) {
    let guildConfig = await util.getGuildConfig(member.guild);
    member.roles.add(guildConfig.mutedRole);
    util.log(member.guild, `Restored muted role for \`${member.user.username}#${member.user.discriminator}\` (see \`[${result.id}]\`)`);
  }
}
