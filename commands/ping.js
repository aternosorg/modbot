const command = {};

command.description = 'Show the ping';

command.usage = '';

command.names = ['ping'];

command.execute = async (message, args, database, bot) => {
  let pong = await message.channel.send(`Pinging...`);
  await pong.edit(`Ping: ${pong.createdTimestamp-message.createdTimestamp}ms \nWebsocket: ${bot.ws.ping}ms`);
};

module.exports = command;
