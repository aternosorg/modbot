const Discord = require('discord.js');
const mysql = require('mysql');
const config = require('./config');
const ip = require('./commands/ip.js');
const automod = require('./features/automod.js');

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
      ip.command(message, args, channels, database);
      break;
  }
});

//message triggered features
bot.on('message', async  (message) => {
  automod.message(message, channels);
});
