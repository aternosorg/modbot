const util = require('../lib/util.js');

const command = {};

command.description = 'Forbid invites in specific channels';

command.usage = '<#channel|channelId> allow|forbid';

command.names = ['invites'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    await message.channel.send('You need the "Manage Server" permission to use this command.');
    return;
  }

  if (!args.length) {
    await message.react(util.icons.error);
    await message.channel.send("USAGE: \`invites allow|forbid\` OR \`invites #channel|channelId allow|forbid|default\`");
    return;
  }

  if (util.channelMentionToId(args[0])) {
    let channel = util.channelMentionToId(args.shift());
    if (!args.length || getMode(args[0]) === null) {
      await message.react(util.icons.error);
      await message.channel.send("USAGE: \`invites #channel|channelId allow|forbid|default\`");
      return;
    }
    let mode = getMode(args.shift());

    let channelConfig = await util.getChannelConfig(channel);
    if (mode === undefined) {
      delete channelConfig.invites;
    }
    else {
      channelConfig.invites = mode;
    }
    await util.saveChannelConfig(channelConfig);

    await message.channel.send(`Invites are now ${mode === undefined ? 'server default' : mode === true ? 'allowed' : 'forbidden'} in <#${channel}>`);

    return;
  }
  if (!args.length || getMode(args[0]) === null) {
    await message.react(util.icons.error);
    await message.channel.send("USAGE: \`invites allow|forbid\` OR \`invites #channel|channelId allow|forbid|default\`");
    return;
  }
  let mode = getMode(args.shift());

  let guildConfig = await util.getGuildConfig(message);
  guildConfig.invites = mode;
  await util.saveGuildConfig(guildConfig);

  await message.channel.send(`Invites are now ${mode === true ? 'allowed' : 'forbidden'}`);
};

function getMode(string) {
  if (['on','allow','allowed'].includes(string)) {
    return true;
  }
  if (['off','forbid','forbidden'].includes(string)) {
    return false;
  }
  if (['default'].includes(string)) {
    return undefined;
  }
  return null;
}

module.exports = command;
