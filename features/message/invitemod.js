const util = require('../../lib/util');

exports.event = async (database, message) => {
  if (!message.guild || message.author.bot || message.member.hasPermission('MANAGE_MESSAGES')) {
    return;
  }

  if (!includesInvite(message.content)) {
    return ;
  }

  let guildConfig = await util.getGuildConfig(message);
  let channelConfig = await util.getChannelConfig(message.channel.id);
  let allowed;

  if (channelConfig && channelConfig.invites !== undefined) {
    allowed = channelConfig.invites;
  }
  else{

    if (guildConfig.invites === undefined) {
      allowed = true;
    }
    else {
      allowed = guildConfig.invites;
    }
  }


  if (!allowed) {
    message.delete({reason: 'Invites are not allowed here'});
    let response = await message.channel.send(`${util.icons.forbidden} <@!${message.author.id}> invites are not allowed here ${util.icons.forbidden}`);
    await response.delete({timeout: 5000});
  }

};

const invites = ['discord.gg','discord.com/invite', 'discordapp.com/invite', 'invite.gg', 'discord.me'];

function includesInvite(string) {
  for (let url of invites) {
    let regex = new RegExp(url + '/\\w+');
    if (string.match(regex)) {
      return true;
    }
  }
}
