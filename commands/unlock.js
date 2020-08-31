const util = require('../lib/util.js');

const command = {};

command.description = 'Unlock a channel';

command.usage = '<#channel|id...> message';

command.names = ['unlock'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!util.isMod(message.member) && !message.member.hasPermission('MANAGE_CHANNELS')) {
    await message.react(util.icons.error);
    return;
  }

  let channels = await util.channelMentions(message.guild,args);
  let everyone = message.guild.roles.everyone;

  if (channels.length) {
    let updates = '';
    for(let channel of channels) {
      channel = message.guild.channels.resolve(channel);
      let config = await util.getChannelConfig(channel.id);
      let permissions = channel.permissionsFor(everyone);

      for(const p of ['SEND_MESSAGES', 'ADD_REACTIONS']) {
        await channel.updateOverwrite(everyone.id, config.lock);
      }

      await util.saveChannelConfig(config);
      updates += `<#${channel.id}>, `;
    }
    await message.channel.send(`Unlocked ${updates.substring(0,updates.length - 2)}!`);
  }
  else {
    //lock all channels with @e write
  }


};

module.exports = command;
