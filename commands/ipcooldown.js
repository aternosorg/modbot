const channelConfig = require('../util/channelConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, channels, database) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" Permission to use this command.')
        return;
    }

    //Get channel
    let channelId = util.channelMentionToId(args.shift());
    if (!message.guild.channels.cache.get(channelId)) {
        await message.channel.send("Please specify a channel on this guild! (#mention) or ID");
        return;
    }

    //Disabling cooldown
    if (args[0] === '0' || args[0] === '0s') {
        if (channels.has(channelId)) {
            channels.get(channelId).cooldown = 0;
            if (channels.get(channelId).mode === 0) {
                await channels.delete(channelId);
                await database.query("DELETE FROM channels WHERE id = ?", [channelId]);
            } else {
                await database.query("UPDATE channels WHERE SET config = ? WHERE id = ?", [JSON.stringify(channels.get(channelId)), channelId]);
            }
            await message.channel.send(`Disabled IP cooldown <#${channelId}>!`);
            return;
        } else {
            await message.channel.send(`IP cooldown in <#${channelId}> is already disabled!`);
            return;
        }
    }

    let sec = await util.timeToSec(message, args.join(' '));

    if (sec == -1)
      return;
    if (sec < 60){
      await message.channel.send('Timers below 60s will be ignored!');
      return;
    }

    let time = util.secToTime(sec);

    if (channels.has(channelId)) {
        //Update Channel
        if (channels.get(channelId).cooldown) {
            await message.channel.send(`Updated IP cooldown of <#${channelId}> to ${time}.`);
        } else {
            await message.channel.send(`Set IP cooldown of <#${channelId}> to ${time}.`);
        }
        channels.get(channelId).cooldown = sec;
        await database.query("UPDATE channels SET config = ? WHERE id =?", [JSON.stringify(channels.get(channelId)), channelId]);
    } else {
        //Add Channel
        channels.set(channelId, new channelConfig(channelId, 0, sec));
        await database.query("INSERT INTO channels (id, config) VALUES (?,?)", [channelId, JSON.stringify(channels.get(channelId))]);
        await message.channel.send(`Set IP cooldown of <#${channelId}> to ${time}.`);
    }
}

exports.names = ['ipcooldown'];
