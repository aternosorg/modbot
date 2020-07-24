const channelConfig = require('../util/channelConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database) => {
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

    let channel = await util.getChannelConfig(channelId);

    if (mode === 0) {
        //Disable Moderation
        channel.mode = 0;
        if (channel.cooldown === 0) {
            await database.query("DELETE FROM channels WHERE id = ?", [channelId]);
        } else {
            await database.query("UPDATE channels SET config = ? WHERE id = ?", [JSON.stringify(channel), channelId]);
        }
        await message.channel.send(`Disabled IP Moderation in <#${channelId}>!`);
    } else {
        if (channel) {
            //Update Moderation
            if (channel.mode) {
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
            channel.mode = mode;
            await database.query("UPDATE channels SET config = ? WHERE id =?", [JSON.stringify(channel), channelId]);
        } else {
            //Add Moderation
            channel = new channelConfig(channelId, mode, 0);
            await database.query("INSERT INTO channels (id, config) VALUES (?,?)", [channelId, JSON.stringify(channel)]);
            if (mode === 1)
                await message.channel.send(`Set channel <#${channelId}> to require IPs.`);
            else
                await message.channel.send(`Set channel <#${channelId}> to forbid IPs.`);
        }
    }
    await util.refreshChannelConfig(channelId);
}

exports.names = ['ip'];
