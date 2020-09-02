const util = require('../lib/util.js');

const command = {};

command.description = 'Require or forbid ips in a channel';

command.usage = '#channel|channelId require|forbid|off';

command.names = ['ip'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    message.channel.send('You need the "Manage Server" permission to use this command.');
    return;
  }

  //Get channel
  let channelId = util.channelMentionToId(args.shift());
  if (!message.guild.channels.cache.get(channelId)) {
    await message.channel.send("Please specify a channel on this guild! (#mention) or ID");
    return;
  }

  if(!args[0]){
    message.channel.send("Subcommands: require, forbid, off");
    return;
  }

  //convert sub command to mode
  let subCommand = args.shift().toLowerCase();
  let mode = getMode(subCommand);

  if(mode === null){
    message.channel.send("Subcommands: require, forbid, off");
    return;
  }

  let channel = await util.getChannelConfig(channelId);
  if (mode === 0) {
    delete channel.mode;
  }
  else {
    channel.mode = mode;
  }
  await util.saveChannelConfig(channel);
  if (mode) {
    await message.channel.send(`Set IPs to ${mode === 1 ? 'required' : 'forbidden'} in <#${channelId}>.`);
  }
  else {
    await message.channel.send(`Disabled IP Moderation in <#${channelId}>!`);
  }
};

function getMode(string) {
  if (['require','required'].includes(string)) {
    return 1;
  }
  if (['forbid','forbidden'].includes(string)) {
    return 2;
  }
  if (['off'].includes(string)) {
    return 0;
  }
  return null;
}

module.exports = command;
