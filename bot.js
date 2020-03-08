//Login to Discord
const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
bot.login(config.auth_token);

//connect to mysql db
const mysql = require('mysql');
const database = mysql.createConnection({
  host: config.dbip,
  user: config.dbuser,
  password: config.dbpassword
});
database.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  database.query("CREATE DATABASE IF NOT EXISTS modbot", function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });
  database.query("USE modbot", function (err, result) {
    if (err) throw err;
    console.log("Connected to MySQL Database!");
  });
});
