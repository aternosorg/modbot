const Discord = require('discord.js');
const mysql = require('mysql');
const config = require('./config');

const bot = new Discord.Client();
bot.login(config.auth_token);

//connect to mysql db
const database = mysql.createConnection(config.db);
database.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

//bot commands
bot.on('message', async  (message) => {
  if(!message.guild || message.author.bot) return;
  if(!message.content.startsWith(config.prefix)) return;

  const args = message.content.split(/\s+/g);
  const command = args.shift().slice(cfg.prefix.length).toLowerCase();

  switch(command){

  }
})
