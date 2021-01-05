const util = require('../../util');
const Log = require('../../Log');
const GuildConfig = require('../../GuildConfig');
const ChannelConfig = require('../../ChannelConfig');

exports.event = async (options, message) => {
  if (!message.guild || message.author.bot || message.member.hasPermission('MANAGE_MESSAGES')) {
    return;
  }

  if (!includesInvite(message.content)) {
    return ;
  }

  let guildConfig = await GuildConfig.get(message.guild.id);
  let channelConfig = await ChannelConfig.get(message.channel.id);
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
    await util.delete(message, {reason: 'Invites are not allowed here'});
    await Log.logMessageDeletion(message, 'Invites are not allowed here');
    let response = await message.channel.send(`<@!${message.author.id}> Invites are not allowed here!`);
    await util.delete(response, {timeout: 5000});
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
