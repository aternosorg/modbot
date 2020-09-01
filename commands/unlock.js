const util = require('../lib/util.js');
const Discord = require('discord.js');

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
  let embed = new Discord.MessageEmbed().setTitle('This channel has been unlocked!').setDescription(args.join(' ')).setColor(util.color.green);
  let everyone = message.guild.roles.everyone;

  if (channels.length) {
    let updates = '';
    for(let channel of channels) {
      channel = message.guild.channels.resolve(channel);
      let config = await util.getChannelConfig(channel.id);

      await channel.updateOverwrite(everyone.id, config.lock);
      config.lock = {};

      await channel.send(embed);
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
