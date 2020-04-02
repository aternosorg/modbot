exports.command = (message, args, channels, database) => {
  if(!message.member.hasPermission('MANAGE_GUILD')){
    message.channel.send('You need the "Manage Server" Permission to use this command.')
    return;
  }

  let subCommand = args[0].toLowerCase();
  if(!['require','forbid','off'].includes(subCommand)){
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
  if(message.mentions.channels.size<1){
    message.channel.send("Please specify a channel! (#mention)");
    return;
  }
  let snowflake = message.mentions.channels.first().id;
  if(mode === 0){
    channels.delete(snowflake);
    database.query("DELETE FROM channels WHERE id = ?",[snowflake]);
    message.channel.send('Disabled IP Moderation in this channel!')
  }
  else{
    if(channels.get(snowflake)){
      channels.set(snowflake, mode);
      database.query("UPDATE channels SET mode = ? WHERE id =?", [mode, snowflake]);
      if(mode === 1)
        message.channel.send('Updated channel <#'+snowflake+'> to require IPs');
      else
        message.channel.send('Updated channel <#'+snowflake+'> to forbid IPs');
    }
    else{
      channels.set(snowflake, mode);
      database.query("INSERT INTO channels (id, mode) VALUES (?,?)",[snowflake,mode]);
      if(mode === 1)
        message.channel.send('Set channel <#'+snowflake+'> to require IPs');
      else
        message.channel.send('Set channel <#'+snowflake+'> to forbid IPs');
    }
  }
}
