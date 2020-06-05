const channelConfig = require('../util/channelConfig.js');

exports.command = async (message, args, channels, database) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" Permission to use this command.')
        return;
    }

    if(!args[0]){
      message.channel.send("Subcommands: require, forbid, off");
      return;
    }

    //convert sub command to mode
    let subCommand = args.shift().toLowerCase();
    if (!['require', 'forbid', 'off'].includes(subCommand)) {
        message.channel.send("Subcommands: require, forbid, off");
        return;
    }
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
    }

    //get channel
    if (message.mentions.channels.size < 1 && !message.guild.channels.cache.get(args[0])) {
        await message.channel.send("Please specify a channel! (#mention) or ID");
        return;
    }
    let snowflake = message.mentions.channels.size ? message.mentions.channels.first().id : args[0];
    if (!message.guild.channels.cache.get(snowflake)) {
        await message.channel.send('This is not a channel on this server!');
        return;
    }

    if (mode === 0) {
        //Disable Moderation
        channels.get(snowflake).mode = 0;
        if (channels.get(snowflake).cooldown === 0) {
            channels.delete(snowflake);
            await database.query("DELETE FROM channels WHERE id = ?", [snowflake]);
        } else {
            await database.query("UPDATE channels SET config = ? WHERE id = ?", [JSON.stringify(channels.get(snowflake)), snowflake]);
        }
        await message.channel.send(`Disabled IP Moderation in <#${snowflake}>!`);
    } else {
        if (channels.has(snowflake)) {
            //Update Moderation
            if (channels.get(snowflake).mode) {
                if (mode === 1)
                    await message.channel.send(`Updated channel <#${snowflake}> to require IPs.`);
                else
                    await message.channel.send(`Updated channel <#${snowflake}> to forbid IPs.`);
            } else {
                if (mode === 1)
                    await message.channel.send(`Set channel <#${snowflake}> to require IPs.`);
                else
                    await message.channel.send(`Set channel <#${snowflake}> to forbid IPs.`);
            }
            channels.get(snowflake).mode = mode;
            await database.query("UPDATE channels SET config = ? WHERE id =?", [JSON.stringify(channels.get(snowflake)), snowflake]);
        } else {
            //Add Moderation
            channels.set(snowflake, new channelConfig(snowflake, mode, 0));
            await database.query("INSERT INTO channels (id, config) VALUES (?,?)", [snowflake, JSON.stringify(channels.get(snowflake))]);
            if (mode === 1)
                await message.channel.send(`Set channel <#${snowflake}> to require IPs.`);
            else
                await message.channel.send(`Set channel <#${snowflake}> to forbid IPs.`);
        }
    }
}

exports.name = 'ip';
