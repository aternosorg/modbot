const util = require('../../lib/util');
const Discord = require('discord.js');

let ignore = new Discord.Collection();
const cache = 30*1000;
exports.event = async (database, message) => {
  if (message.author.bot || ignore.has(message.id)) {
    return ;
  }
};

exports.ignore = (id) => {
  ignore.set(id, Date.now());
};

exports.purgeCache = () => {
  ignore = ignore.filter(timestamp => timestamp > Date.now() + cache);
  console.log(ignore);
};
