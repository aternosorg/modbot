const util = require('../lib/util.js');
const Discord = require('discord.js');

const command = {};

command.description = 'Dissallow users to send messages to a channel';

command.usage = '<global|#channel|id...> message';

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

      if (await lock(channel, everyone, embed))
        updates += `<#${channel.id}>, `;
    }
    if (updates.length) {
      await message.channel.send(`Locked ${updates.substring(0,updates.length - 2)}!`);
    }
    else {
      await message.channel.send(`No channels to lock!`);
    }
  }
  else if (args.length && ['all','global'].includes(args[0].toLowerCase())){
    args = args.slice(1);
    let embed = new Discord.MessageEmbed().setTitle('This channel has been locked!').setDescription(args.join(' ')).setColor(util.color.red);
    channels = bot.guilds.cache.get(message.guild.id).channels.cache;
    let updates = '';
    for(let [id, channel] of channels) {
      if (!(channel instanceof Discord.TextChannel)) {
        continue;
      }

      if (await lock(channel, everyone, embed))
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
    await message.channel.send(await util.usage(message, command.names[0]));
  }
};

/**
 * lock - locks a channel
 *
 * @param  {Discord.TextChannel}          channel  the channel to lock
 * @param  {Discord.Snowflake}            everyone the id of the @everyone role
 * @param  {Discord.MessageEmbed|String}  message  the message to send to the channel
 * @return {Boolean}                      did the channel have to be locked?
 */
async function lock(channel, everyone, message) {
  let config = await util.getChannelConfig(channel.id);
  let permissions = channel.permissionsFor(everyone);

  if (!permissions.has('VIEW_CHANNEL')) {
    return false;
  }

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
    return false;
  }

  await channel.send(message);
  await util.saveChannelConfig(config);

  return true;
}

module.exports = command;
