const channelConfig = require('../util/channelConfig.js');
const util = require('../lib/util.js');

const command = {};

command.description = 'Set a cooldown on ips in a channel';

command.usage = '#channel|channelId duration';

command.comment = 'If the cooldown has less then 60s remaining the message will not be deleted';

command.names = ['ipcooldown'];

command.execute = async (message, args, database, bot) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" permission to use this command.');
        return;
    }

    //Get channel
    let channelId = util.channelMentionToId(args.shift());
    if (!message.guild.channels.cache.get(channelId)) {
        await message.channel.send("Please specify a channel on this guild! (#mention) or ID");
        return;
    }

    let channel = await util.getChannelConfig(channelId);

    //Disabling cooldown
    if (args[0] === '0' || args[0] === '0s') {
      channel.cooldown = 0;
      await util.saveChannelConfig(channel);
      await message.channel.send(`Disabled IP cooldown <#${channelId}>!`);
      return;
    }

    let sec = util.timeToSec(args.join(' '));

    if (sec < 60){
      await message.channel.send('Please provide a valid time (Min: 60s)!');
      return;
    }

    let time = util.secToTime(sec);

    channel.cooldown = sec;
    await util.saveChannelConfig(channel);
    await message.channel.send(`Set IP cooldown of <#${channelId}> to ${time}.`);
};

module.exports = command;
