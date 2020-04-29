const Discord = require('discord.js');
const mysql = require('mysql');

const config = require('./config');
const channelConfig = require('./util/channelConfig.js');

const ip = require('./commands/ip.js');
const ipcooldown = require('./commands/ipcooldown.js');

const automod = require('./features/automod.js');
const cooldown = require('./features/cooldown.js');

const bot = new Discord.Client();
bot.login(config.auth_token);

bot.on('ready', ()=> {
  bot.user.setActivity('https://git.io/Jvhfg', {type: 'WATCHING'});
  //clean servers every 1h
  cooldown.clean(database, channels, bot);
  setInterval(() => { cooldown.clean(database, channels, bot)},3600000);
});

let channels = new Discord.Collection();

//connect to mysql db
const database = mysql.createConnection(config.db);
database.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

  database.query('CREATE TABLE IF NOT EXISTS `channels` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))');
  /*  id => discord channel snowflake
      mode => 1 = require ips, 2 = forbid ips
      cooldown => cooldown time in seconds        */
  database.query('CREATE TABLE IF NOT EXISTS `servers` (`channelid` VARCHAR(20) NOT NULL, `ip` varchar(20) NOT NULL, `timestamp` int NOT NULL, PRIMARY KEY (`ip`,`channelid`))');
  /*  ip => unique part of the server IPs
      timestamp => Unix Time                      */
  //load channels
  database.query("SELECT * FROM channels", function(err, result) {
    if (err) throw err;
    result.forEach( row => {
      channels.set(row.id, JSON.parse(row.config));
    });
  });
});

//bot commands
bot.on('message', async  (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.toLowerCase().startsWith(config.prefix.toLowerCase())) return;

  const args = message.content.split(/\s+/g);
  const command = args.shift().slice(config.prefix.length).toLowerCase();

  switch(command) {
    case "ip":
      ip.command(message, args, channels, database);
      break;
    case "ipcooldown":
      ipcooldown.command(message, args, channels, database);
      break;
  }
});

//message triggered features
bot.on('message', async  (message) => {
  automod.message(message, channels);
  cooldown.message(message, channels, database);
});
