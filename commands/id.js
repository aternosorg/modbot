const command = {};

const util = require('../lib/util');

command.description = 'Find a user\'s ID';

command.usage = '<name|name#1234>';

command.comment = 'This will only find the user if he is in a common guild with the bot';

command.names = ['id'];

command.execute = async (message, args, database, bot) => {
  let response;
  if (!args.length) {
    response = message.author.id;
  }
  else {
    try {
      response = (await bot.users.fetch(util.userMentionToId(args[0]))).id;
    } catch {
      let [name,discrim] = args[0].split('#');
      if (discrim) {
        user = bot.users.cache.find(u => u.username === name && u.discriminator === discrim);
      }
      else {
        user = bot.users.cache.find(u => u.username === name);
      }
      if (!user) {
        response = `The user ${args[0]} was not found!`;
      }
      else {
        response = user.id;
      }
    }
  }

  await message.channel.send(response);
};

module.exports = command;
