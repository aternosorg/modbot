const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }

    if (!args.length) {
      await message.react(util.icons.error);
      await message.channel.send("USAGE: \`invites allow|forbid\` OR \`invites #channel|channelId allow|forbid\`");
      return;
    }

    if (util.channelMentionToId(args[0])) {
      let channel = util.channelMentionToId(args.shift());
      if (!args.length || getMode(args[0]) === null) {
        await message.react(util.icons.error);
        await message.channel.send("USAGE: \`invites #channel|channelId allowed|forbidden\`");
        return;
      }
      let mode = getMode(args.shift());

      let guildConfig = await util.getGuildConfig(message);
      let channelConfig = await util.getChannelConfig(channel);
      channelConfig.invites = guildConfig.invites === mode ? false : true;
      await util.saveChannelConfig(channelConfig);

      await message.channel.send(`Invites are now ${mode === true ? 'allowed' : 'forbidden'} in <#${channel}>`);

      return;
    }
    if (!args.length || getMode(args[0]) === null) {
      await message.react(util.icons.error);
      await message.channel.send("USAGE: \`invites allow|forbid\` OR \`invites #channel|channelId allow|forbid\`");
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
  if (['off','forbid','forbidden']) {
    return false;
  }
  return null;
}

exports.names = ['invites'];
