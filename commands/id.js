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
      let fullname = args.join(' ');
      let user,[name,discrim] = fullname.split('#');
      if (discrim) {
        
        user = bot.users.cache.find(u => u.username === name && u.discriminator === discrim);
        if (!user) {
          user = bot.users.cache.find(u => u.username.toLowerCase() === name.toLowerCase() && u.discriminator === discrim);
        }

      } else {

        user = bot.users.cache.find(u => u.username === name);
        if (!user) {
          user = bot.users.cache.find(u => u.username.toLowerCase() === name.toLowerCase());
        }

      }

      if (!user) {
        response = `The user ${fullname} was not found!`;
      }
      else {
        response = user.id;
      }
    }
  }

  await message.channel.send(response);
};

module.exports = command;
