const Discord = require('discord.js');
const mysql = require('mysql');
const config = require('./config');

const bot = new Discord.Client();
bot.login(config.auth_token);

let channels = new Discord.Collection();

//connect to mysql db
const database = mysql.createConnection(config.db);
database.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  database.query("CREATE TABLE IF NOT EXISTS `channels` (`id` VARCHAR(20) NOT NULL, `mode` TINYINT NOT NULL, PRIMARY KEY (`id`), UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE)");
  // id => discord channel snowflake
  // mode => 1 = require ips, 2 = forbid ips

  //load channels
  database.query("SELECT * FROM channels", function(err, result){
    if(err) throw err;
    result.forEach( row => {
      channels.set(row.id, row.mode);
    });
  });
});

//bot commands
bot.on('message', async  (message) => {
  if(!message.guild || message.author.bot) return;
  if(!message.content.toLowerCase().startsWith(config.prefix.toLowerCase())) return;

  const args = message.content.split(/\s+/g);
  const command = args.shift().slice(config.prefix.length).toLowerCase();

  switch(command){
    case "ip":
      //args[0].toLowerCase()!='require'&&args[0].toLowerCase()!='forbid'
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
    break;
  }
});
