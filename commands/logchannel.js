const util = require('../lib/util.js');

const command = {};

command.description = 'Specify the log channel';

command.usage = '#channel|channelId';

command.names = ['logchannel'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    message.channel.send('You need the "Manage Server" permission to use this command.');
    return;
  }

  //Get channel
  let channelId = util.channelMentionToId(args.shift());
  if (channelId && !message.guild.channels.resolve(channelId)) {
    await message.channel.send("Please specify a channel! (#mention or ID)");
    return;
  }

  let config = await util.getGuildConfig(message);
  if (channelId) {
    config.logChannel = channelId;
  }
  else {
    delete config.logChannel;
  }
  await util.saveGuildConfig(config);

  if (channelId) {
    await message.channel.send(`Set log channel to <#${channelId}>!`);
  }
  else {
    await message.channel.send(`Disabled log!`);
  }
};

module.exports = command;
