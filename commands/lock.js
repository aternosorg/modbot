const util = require('../lib/util.js');
const Discord = require('discord.js');

const command = {};

command.description = 'Dissallow users to send messages to a channel';

command.usage = '<#channel|id...> message';

command.names = ['lock'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!util.isMod(message.member) && !message.member.hasPermission('MANAGE_CHANNELS')) {
    await message.react(util.icons.error);
    return;
  }

  let channels = await util.channelMentions(message.guild,args);
  let embed = new Discord.MessageEmbed().setTitle('This channel has been locked!').setDescription(args.join(' ')).setColor(util.color.red);
  let everyone = message.guild.roles.everyone.id;

  if (channels.length) {
    let updates = '';
    for(let channel of channels) {
      channel = message.guild.channels.resolve(channel);
      let config = await util.getChannelConfig(channel.id);
      let permissions = channel.permissionsFor(everyone);

      let con = true;
      for(const p of ['SEND_MESSAGES', 'ADD_REACTIONS']) {
        if (permissions.has(p)) {
          if (channel.permissionOverwrites.get(everyone)) {
            config.lock[p] = channel.permissionOverwrites.get(everyone).allow.has(p) ? true : null;
          }
          else {
            config.lock[p] = null;
          }
          let o = {};
          o[p] = false;
          await channel.updateOverwrite(everyone, o);
          con = false;
        }
      }

      if (con) {
        continue;
      }

      await channel.send(embed);
      await util.saveChannelConfig(config);
      updates += `<#${channel.id}>, `;
    }
    if (updates.length) {
      await message.channel.send(`Locked ${updates.substring(0,updates.length - 2)}!`);
    }
    else {
      await message.channel.send(`No channels to lock!`);
    }
  }
  else {
    //lock all channels with @e write
  }


};

module.exports = command;
