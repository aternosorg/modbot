const util = require('../../lib/util');

exports.event = async (options, member) => {
  let result = await options.database.query("SELECT * FROM moderations WHERE action = 'mute' AND active = TRUE AND userid = ? AND guildid = ?",[member.id,member.guild.id]);
  if (result) {
    let guildConfig = await util.getGuildConfig(member.guild);
    await member.roles.add(guildConfig.mutedRole);
    await util.logMessageEmbed(member.guild, '', {
      title: `Restored mute | ${member.user.username}#${member.user.discriminator}`,
      description: `Mute ID: ${result.id}`,
      footer: {text:`ID: ${member.id}`}
    });
  }
};
