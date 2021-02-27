const util = require('../../util.js');
const Discord = require('discord.js');
const ChannelConfig = require('../../ChannelConfig');
const GuildConfig = require('../../GuildConfig');

const command = {};

command.description = 'Unlock a channel';

command.usage = '<global|#channel|id…> message';

command.names = ['unlock'];

command.execute = async (message, args, database, bot) => {
  /** @type {GuildConfig} */
  const guildconfig = await GuildConfig.get(message.guild.id);
  //Permission check
  if (!guildconfig.isMod(message.member) && !message.member.hasPermission('MANAGE_CHANNELS')) {
    await message.react(icons.error);
    return;
  }

  const /** @type {module:"discord.js".Snowflake[]} */ channels = await util.channelMentions(message.guild,args);
  const embed = new Discord.MessageEmbed().setTitle('This channel has been unlocked!').setDescription(args.join(' ')).setColor(util.color.green);
  const everyone = message.guild.roles.everyone.id;

  if (channels.length) {
    const updates = [];
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
    const embed = new Discord.MessageEmbed().setTitle('This channel has been unlocked!').setDescription(args.join(' ')).setColor(util.color.green);
    const channels = bot.guilds.cache.get(message.guild.id).channels.cache;
    const updates = [];
    for(const [, channel] of channels) {
      if (!(channel instanceof Discord.TextChannel)) {
        continue;
      }

      if (await unlock(/** @type {module:"discord.js".TextChannel} */ channel, everyone, embed))
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
 * @param  {module:"discord.js".TextChannel}          channel  the channel to unlock
 * @param  {Snowflake}                                everyone the id of the @everyone role
 * @param  {module:"discord.js".MessageEmbed|String}  message  the message to send to the channel
 * @return {Boolean}                      was the channel locked?
 */
async function unlock(channel, everyone, message) {
  const config = await ChannelConfig.get(/** @type {module:"discord.js".Snowflake} */ channel.id);

  if (Object.keys(config.lock).length === 0) {
    return false;
  }

  await util.retry(channel.updateOverwrite,channel,[everyone,config.lock],3, (/** @type {module:"discord.js".GuildChannel} */ channel) => {
    for (const key of Object.keys(config.lock)) {
      if (channel.permissionOverwrites.get(everyone).deny.has(/** @type {PermissionResolvable} */ key)) {
        return false;
      }
      if (config.lock[key] === true && !channel.permissionOverwrites.get(everyone).allow.has(/** @type {PermissionResolvable} */ key)) {
        return false;
      }
    }
    return true;
  })
  config.lock = {};

  await channel.send(message);
  await config.save();
  return true;
}

module.exports = command;
