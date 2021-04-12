const util = require('../../util.js');
const GuildConfig = require('../../GuildConfig');

const command = {};

command.description = 'Specify the log channel';

command.usage = '<#channel|channelId|off>';

command.names = ['logchannel','log'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    await message.channel.send('You need the "Manage Server" permission to use this command.');
    return;
  }

  if (args.length === 0) {
    await message.channel.send(await util.usage(message, command.names[0]));
    return;
  }

  if (['off','disabled'].includes(args[0].toLowerCase())) {
    let config = await GuildConfig.get(message.guild.id);
    delete config.logChannel;
    await config.save();
    await message.channel.send(`Disabled log!`);
    return;
  }

  //Get channel
  let channelId = util.channelMentionToId(args.shift());
  if (!message.guild.channels.resolve(channelId)) {
    await message.channel.send(await util.usage(message,command.names[0]));
    return;
  }

  if (!message.guild.channels.resolve(channelId).permissionsFor(bot.user).has(['VIEW_CHANNEL','SEND_MESSAGES'])) {
    await message.channel.send("The bot doesn't have the permission to send messages in this channel!")
    return;
  }

  let config = await GuildConfig.get(message.guild.id);
  config.logChannel = channelId;
  await config.save();
  await message.channel.send(`Set log channel to <#${channelId}>!`);
};

module.exports = command;
