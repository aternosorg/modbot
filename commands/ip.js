exports.command = (message, args, channels, database) => {
  if(!['require','forbid','off'].includes(args[0])){
    message.channel.send("Subcommands: require, forbid, off");
    return;
  }
  var mode;
  switch (args[0]) {
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
  if(message.mentions.channels.size<1){
    message.channel.send("Please specify a channel! (#mention)");
    return;
  }
  var snowflake = message.mentions.channels.first().id;
  if(mode == 0){
    channels.delete(snowflake);
    database.query("DELETE FROM channels WHERE id ="+snowflake);
    message.channel.send('Disabled IP Moderation in this channel!')
  }
  else{
    if(channels.get(snowflake)){
      channels.set(snowflake, mode);
      database.query("UPDATE channels SET mode = "+mode+" WHERE id ='"+snowflake+"'");
      if(mode == 1)
        message.channel.send('Set channel <#'+snowflake+'> to require IPs');
      else
        message.channel.send('Set channel <#'+snowflake+'> to forbid IPs');
    }
    else{
      channels.set(snowflake, mode);
      database.query("INSERT INTO channels (id, mode) VALUES ("+snowflake+","+mode+")");
      if(mode == 1)
        message.channel.send('Updated channel <#'+snowflake+'> to require IPs');
      else
        message.channel.send('Updated channel <#'+snowflake+'> to forbid IPs');
    }
  }
}
