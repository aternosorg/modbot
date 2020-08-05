const channelConfig = require('../util/channelConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
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
        if (channel) {
            channel.cooldown = 0;
            if (channel.mode === 0) {
                await database.query("DELETE FROM channels WHERE id = ?", [channelId]);
            } else {
                await database.query("UPDATE channels SET config = ? WHERE id = ?", [JSON.stringify(channel), channelId]);
            }
            await message.channel.send(`Disabled IP cooldown <#${channelId}>!`);
        } else {
            await message.channel.send(`IP cooldown in <#${channelId}> is already disabled!`);
        }
        await util.refreshChannelConfig(channelId);
        return;
    }

    let sec = util.timeToSec(args.join(' '));

    if (sec < 60){
      await message.channel.send('Please provide a valid time (Min: 60s)!');
      return;
    }

    let time = util.secToTime(sec);

    if (channel) {
        //Update Channel
        if (channel.cooldown) {
            await message.channel.send(`Updated IP cooldown of <#${channelId}> to ${time}.`);
        } else {
            await message.channel.send(`Set IP cooldown of <#${channelId}> to ${time}.`);
        }
        channel.cooldown = sec;
        await database.query("UPDATE channels SET config = ? WHERE id =?", [JSON.stringify(channel), channelId]);
    } else {
        //Add Channel
        channel= new channelConfig(channelId, 0, sec);
        await database.query("INSERT INTO channels (id, config) VALUES (?,?)", [channelId, JSON.stringify(channel)]);
        await message.channel.send(`Set IP cooldown of <#${channelId}> to ${time}.`);
    }

    await util.refreshChannelConfig(channelId);
};

exports.names = ['ipcooldown'];
