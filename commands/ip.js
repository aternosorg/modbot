const channelConfig = require('../util/channelConfig.js');

exports.command = (message, args, channels, database) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    message.channel.send('You need the "Manage Server" Permission to use this command.')
    return;
  }

  //convert sub command to mode
  let subCommand = args.shift().toLowerCase();
  if (!['require','forbid','off'].includes(subCommand)) {
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
  if (message.mentions.channels.size<1 && !message.guild.channels.cache.get(args[0])) {
    message.channel.send("Please specify a channel! (#mention) or ID");
    return;
  }
  let snowflake
  if (message.mentions.channels.size>0) {
    snowflake = message.mentions.channels.first().id;
    if (!message.guild.channels.cache.get(snowflake)) {
      message.channel.send('This is not a channel on this server!');
      return;
    }
  }
  else {
    snowflake = args[0];
  }

  if (mode === 0) {
    //Disable Moderation
    channels.get(snowflake).mode = 0;
    if (channels.get(snowflake).cooldown===0) {
      channels.delete(snowflake);
      database.query("DELETE FROM channels WHERE id = ?",[snowflake]);
    }
    else {
      database.query("UPDATE channels WHERE SET config = ? WHERE id = ?",[JSON.stringify(channels.get(snowflake)),snowflake]);
    }
    message.channel.send(`Disabled IP Moderation in <#${snowflake}>!`);
  }
  else {
    console.log(channels.has(snowflake));
    if (channels.has(snowflake)) {
      //Update Moderation
      if (channels.get(snowflake).mode) {
        if (mode === 1)
          message.channel.send(`Updated channel <#${snowflake}> to require IPs.`);
        else
          message.channel.send(`Updated channel <#${snowflake}> to forbid IPs.`);
      }
      else {
        if (mode === 1)
          message.channel.send(`Set channel <#${snowflake}> to require IPs.`);
        else
          message.channel.send(`Set channel <#${snowflake}> to forbid IPs.`);
      }
      channels.get(snowflake).mode = mode;
      database.query("UPDATE channels SET config = ? WHERE id =?", [JSON.stringify(channels.get(snowflake)), snowflake]);
    }
    else {
      //Add Moderation
      channels.set(snowflake, new channelConfig(snowflake, mode, 0));
      database.query("INSERT INTO channels (id, config) VALUES (?,?)",[snowflake,JSON.stringify(channels.get(snowflake))]);
      if (mode === 1)
        message.channel.send(`Set channel <#${snowflake}> to require IPs.`);
      else
        message.channel.send(`Set channel <#${snowflake}> to forbid IPs.`);
    }
  }
}
