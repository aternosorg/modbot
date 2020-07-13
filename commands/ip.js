const channelConfig = require('../util/channelConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, guilds, channels, database) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    if(!args[0]){
      message.channel.send("Subcommands: require, forbid, off");
      return;
    }

    //convert sub command to mode
    let subCommand = args.shift().toLowerCase();

    let mode;
    switch (subCommand) {
      case 'require':
        mode = 1;
        break;
      case 'forbid':
        mode = 2;
        break;
      case 'off':
        mode = 0;
        break;
      default:
        message.channel.send("Subcommands: require, forbid, off");
        return;
    }

    //Get channel
    let channelId = util.channelMentionToId(args.shift());
    if (!message.guild.channels.cache.get(channelId)) {
        await message.channel.send("Please specify a channel on this guild! (#mention) or ID");
        return;
    }

    if (mode === 0) {
        //Disable Moderation
        channels.get(channelId).mode = 0;
        if (channels.get(channelId).cooldown === 0) {
            channels.delete(channelId);
            await database.query("DELETE FROM channels WHERE id = ?", [channelId]);
        } else {
            await database.query("UPDATE channels SET config = ? WHERE id = ?", [JSON.stringify(channels.get(channelId)), channelId]);
        }
        await message.channel.send(`Disabled IP Moderation in <#${channelId}>!`);
    } else {
        if (channels.has(channelId)) {
            //Update Moderation
            if (channels.get(channelId).mode) {
                if (mode === 1)
                    await message.channel.send(`Updated channel <#${channelId}> to require IPs.`);
                else
                    await message.channel.send(`Updated channel <#${channelId}> to forbid IPs.`);
            } else {
                if (mode === 1)
                    await message.channel.send(`Set channel <#${channelId}> to require IPs.`);
                else
                    await message.channel.send(`Set channel <#${channelId}> to forbid IPs.`);
            }
            channels.get(channelId).mode = mode;
            await database.query("UPDATE channels SET config = ? WHERE id =?", [JSON.stringify(channels.get(channelId)), channelId]);
        } else {
            //Add Moderation
            channels.set(channelId, new channelConfig(channelId, mode, 0));
            await database.query("INSERT INTO channels (id, config) VALUES (?,?)", [channelId, JSON.stringify(channels.get(channelId))]);
            if (mode === 1)
                await message.channel.send(`Set channel <#${channelId}> to require IPs.`);
            else
                await message.channel.send(`Set channel <#${channelId}> to forbid IPs.`);
        }
    }
}

exports.names = ['ip'];
