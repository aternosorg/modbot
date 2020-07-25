const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    //Get channel
    let channelId = util.channelMentionToId(args.shift());
    if (channelId && !message.guild.channels.resolve(channelId)) {
        await message.channel.send("Please specify a channel! (#mention or ID)");
        return;
    }

    let guildId = message.guild.id;

    let config = await util.getGuildConfig(message);
    config.logChannel = channelId;
    util.saveGuildConfig(config);

    if (channelId) {
      await message.channel.send(`Set log channel to <#${channelId}>!`);
    }
    else {
      await message.channel.send(`Disabled log!`);
    }
}

exports.names = ['logchannel'];
