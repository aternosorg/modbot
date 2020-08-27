const command = {};

const util = require('../lib/util');

command.description = 'Find a user\'s ID';

command.usage = '<name|name#1234>';

command.comment = 'This will only find the user if he is in a common guild with the bot';

command.names = ['id'];

command.execute = async (message, args, database, bot) => {
  let id;
  if (!args.length) {
    id = message.author.id;
  }
  else {
    try {
      id = (await bot.users.fetch(util.userMentionToId(args[0]))).id;
    } catch {
      let [name,discrim] = args[0].split('#');
      if (discrim) {
        user = bot.users.cache.find(u => u.username === name && u.discriminator === discrim);
      }
      else {
        user = bot.users.cache.find(u => u.username === name);
      }
      if (!user) {
        if (discrim) {
          id = `The user ${name}#${discrim} was not found!`;
        }
        else {
          id = `The user ${name} was not found!`;
        }
      }
      else {
        id = user.id;
      }
    }
  }

  await message.channel.send(id);
};

module.exports = command;
