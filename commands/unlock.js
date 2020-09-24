const util = require('../lib/util.js');
const Discord = require('discord.js');

const command = {};

command.description = 'Unlock a channel';

command.usage = '<global|#channel|id…> message';

command.names = ['unlock'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!await util.isMod(message.member) && !message.member.hasPermission('MANAGE_CHANNELS')) {
    await message.react(util.icons.error);
    return;
  }

  let channels = await util.channelMentions(message.guild,args);
  let embed = new Discord.MessageEmbed().setTitle('This channel has been unlocked!').setDescription(args.join(' ')).setColor(util.color.green);
  let everyone = message.guild.roles.everyone.id;

  if (channels.length) {
    let updates = [];
    for(let channel of channels) {
      channel = message.guild.channels.resolve(channel);
      if (await unlock(channel, everyone, embed))
        updates.push(`<#${channel.id}>`);
    }
    if (updates.length) {
      await message.channel.send(`Unlocked ${updates.join(', ')}!`);
    }
    else {
      await message.channel.send(`No channels to unlock!`);
    }
  }
  else if (args.length && ['all','global'].includes(args[0].toLowerCase())){
    args = args.slice(1);
    let embed = new Discord.MessageEmbed().setTitle('This channel has been unlocked!').setDescription(args.join(' ')).setColor(util.color.green);
    channels = bot.guilds.cache.get(message.guild.id).channels.cache;
    let updates = [];
    for(let [id, channel] of channels) {
      if (!(channel instanceof Discord.TextChannel)) {
        continue;
      }

      if (await unlock(channel, everyone, embed))
        updates.push(`<#${channel.id}>`);
    }
    if (updates.length) {
      await message.channel.send(`Unlocked ${updates.join(', ')}!`);
    }
    else {
      await message.channel.send(`No channels to unlock!`);
    }
  }
  else {
    await message.channel.send(await util.usage(message, command.names[0]));
  }
};

/**
 * unlock - unlocks a channel
 *
 * @param  {Discord.TextChannel}          channel  the channel to unlock
 * @param  {Discord.Snowflake}            everyone the id of the @everyone role
 * @param  {Discord.MessageEmbed|String}  message  the message to send to the channel
 * @return {Boolean}                      was the channel locked?
 */
async function unlock(channel, everyone, message) {
  let config = await util.getChannelConfig(channel.id);

  if (Object.keys(config.lock).length === 0) {
    return false;
  }

  await channel.updateOverwrite(everyone, config.lock);
  config.lock = {};

  await channel.send(message);
  await util.saveChannelConfig(config);
  return true;
}

module.exports = command;
