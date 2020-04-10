const channelConfig = require('../util/channelConfig.js');
exports.command = (message, args, channels, database) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    message.channel.send('You need the "Manage Server" Permission to use this command.')
    return;
  }

  //Get channel
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

  //Disabling cooldown
  if (args[1]===0||args[1]==='0s') {
    channels.get(snowflake).cooldown = 0;
    if (channels.get(snowflake).mode===0) {
      channels.delete(snowflake);
    }
    database.query("DELETE FROM channels WHERE id = ?",[snowflake]);
    message.channel.send(`Disabled IP cooldown <#${snowflake}>!`);
    return;
  }

  //Convert time to s
  let time = 0;
  args[1].split(' ').forEach(word => {
    if (word.endsWith('s')) {
      time += parseInt(word,10);
    }
    if (word.endsWith('m')) {
      time += parseInt(word,10)*60;
    }
    if (word.endsWith('h')) {
      time += parseInt(word,10)*60*60;
    }
    if (word.endsWith('d')) {
      time += parseInt(word,10)*60*60*24;
    }
  });

  //check time
  if (time<60) {
    message.channel.send('Please enter a valid Cooldown time (Min: 60s).');
    return;
  }


  if(channels.has(snowflake)){
    //Update Channel
    if (channels.get(snowflake).cooldown) {
      message.channel.send(`Updated IP cooldown of <#${snowflake}> to ${args[1]}`);
    }
    else {
        message.channel.send(`Set IP cooldown of <#${snowflake}> to ${args[1]}`);
    }
    channels.get(snowflake).cooldown = time;
    database.query("UPDATE channels SET cooldown = ? WHERE id =?", [time, snowflake]);
  }
  else{
    //Add Channel
    channels.set(snowflake,new channelConfig(snowflake, 0, time));
    database.query("INSERT INTO channels (id, cooldown) VALUES (?,?)",[snowflake,time]);
    message.channel.send(`Set IP cooldown of <#${snowflake}> to ${args[1]}`);
  }
}
