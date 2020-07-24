const guildConfig = require('../util/guildConfig.js');
const util = require('../lib/util.js');

exports.command = async (message, args, database) => {
    //Permission check
    if (!message.member.hasPermission('MANAGE_GUILD')) {
        message.channel.send('You need the "Manage Server" Permission to use this command.');
        return;
    }

    //Get channel
    let channelId = util.channelMentionToId(args.shift());
    if (channelId && !message.guild.channels.cache.get(channelId)) {
        await message.channel.send("Please specify a channel! (#mention or ID)");
        return;
    }

    let guildId = message.guild.id;

    let result = await database.query("SELECT * FROM guilds WHERE id = ?",[guildId]);
    if(result){
      if (channelId) {
        let config = JSON.parse(result.config);
        config.logChannel = channelId;
        await database.query("UPDATE guilds SET config = ? WHERE id = ?",[JSON.stringify(config),guildId]);
      } else {
        await database.query("DELETE FROM guilds WHERE id = ?",[guildId]);
      }
    }
    else{
      await database.query("INSERT INTO guilds (config,id) VALUES (?,?)",[JSON.stringify(new guildConfig(guildId,channelId)),guildId]);
    }

    await util.refreshGuildConfig(guildId);

    if (channelId) {
      await message.channel.send(`Set log channel to <#${channelId}>!`);
    }
    else {
      await message.channel.send(`Disabled log!`);
    }
}

exports.names = ['logchannel'];
