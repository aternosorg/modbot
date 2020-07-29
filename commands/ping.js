const config = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  let pong = await message.channel.send(`Pinging...`);
  await pong.edit(`Ping: ${pong.createdTimestamp-message.createdTimestamp}ms \nWebsocket: ${bot.ws.ping}ms`);
}

exports.names = ['ping'];
