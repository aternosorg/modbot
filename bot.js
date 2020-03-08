const Discord = require('discord.js');
const config = require('./config');

const bot = new Discord.Client();
bot.login(config.auth_token);

//connect to mysql db
const mysql = require('mysql');
const database = mysql.createConnection(config.db);
database.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
