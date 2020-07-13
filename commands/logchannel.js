const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, guilds, channels, database) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    //Get channel
    let channelId = util.channelMentionToId(args.shift());
    if (!message.guild.channels.cache.get(channelId)) {
        await message.channel.send("Please specify a channel! (#mention or ID)");
        return;
    }

    let guildId = message.guild.id;

    if (guilds.has(guildId)) {
      guilds.get(guildId).logChannel = channelId;
      await database.query("UPDATE guilds SET config = ? WHERE id = ?",[JSON.stringify(guilds.get(guildId)),guildId]);
    }
    else {
      guilds.set(guildId, new guildConfig(guildId,channelId))
      await database.query("INSERT INTO guilds (config,id) VALUES (?,?)",[JSON.stringify(guilds.get(guildId)),guildId]);
    }

    await message.channel.send(`Set log channel to <#${channelId}>!`);
}

exports.names = ['logchannel'];
