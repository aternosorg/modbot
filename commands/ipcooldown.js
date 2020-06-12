const channelConfig = require('../util/channelConfig.js');
exports.command = async (message, args, channels, database) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        await message.channel.send('You need the "Manage Server" Permission to use this command.')
        return;
    }

    //Get channel
    if (message.mentions.channels.size < 1 && !message.guild.channels.cache.get(args[0])) {
        await message.channel.send("Please specify a channel! (#mention) or ID");
        return;
    }

    let snowflake = message.mentions.channels.size ? message.mentions.channels.first().id : args[0];
    if (!message.guild.channels.cache.get(snowflake)) {
        await message.channel.send('This is not a channel on this server!');
        return;
    }

    //Disabling cooldown
    if (args[1] === '0' || args[1] === '0s') {
        if (channels.has(snowflake)) {
            channels.get(snowflake).cooldown = 0;
            if (channels.get(snowflake).mode === 0) {
                await channels.delete(snowflake);
                await database.query("DELETE FROM channels WHERE id = ?", [snowflake]);
            } else {
                await database.query("UPDATE channels WHERE SET config = ? WHERE id = ?", [JSON.stringify(channels.get(snowflake)), snowflake]);
            }
            await message.channel.send(`Disabled IP cooldown <#${snowflake}>!`);
            return;
        } else {
            await message.channel.send(`IP cooldown in <#${snowflake}> is already disabled!`);
            return;
        }
    }

    //Convert time to s
    let time = 0;
    args[1].split(' ').forEach(word => {
        if (word.endsWith('s')) {
            time += parseInt(word, 10);
        }
        if (word.endsWith('m')) {
            time += parseInt(word, 10) * 60;
        }
        if (word.endsWith('h')) {
            time += parseInt(word, 10) * 60 * 60;
        }
        if (word.endsWith('d')) {
            time += parseInt(word, 10) * 60 * 60 * 24;
        }
    });

    //check time
    if (time < 60) {
        await message.channel.send('Please enter a valid Cooldown time (Min: 60s).');
        return;
    }


    if (channels.has(snowflake)) {
        //Update Channel
        if (channels.get(snowflake).cooldown) {
            await message.channel.send(`Updated IP cooldown of <#${snowflake}> to ${args[1]}`);
        } else {
            await message.channel.send(`Set IP cooldown of <#${snowflake}> to ${args[1]}`);
        }
        channels.get(snowflake).cooldown = time;
        await database.query("UPDATE channels SET config = ? WHERE id =?", [JSON.stringify(channels.get(snowflake)), snowflake]);
    } else {
        //Add Channel
        channels.set(snowflake, new channelConfig(snowflake, 0, time));
        await database.query("INSERT INTO channels (id, config) VALUES (?,?)", [snowflake, JSON.stringify(channels.get(snowflake))]);
        await message.channel.send(`Set IP cooldown of <#${snowflake}> to ${args[1]}.`);
    }
}

exports.names = ['ipcooldown'];
