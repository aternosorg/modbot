const util = require('../lib/util.js');
const config = require('../config');

const command = {};

command.description = 'Change the prefix';

command.usage = '<newPrefix>';

command.comment = 'The default prefix (\`${config.prefix}\`) will still work (in addition to your specified prefix)';

command.names = ['prefix'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    await message.channel.send('You need the "Manage Server" permission to use this command.');
    return;
  }

  let guild = await util.getGuildConfig(message);
  if (args.length === 0) {
    await message.channel.send(`The prefix is \`${guild.prefix}\``);
    return;
  }

  //Get channel
  let prefix = args.join('-');

  if (prefix.match(/ /)) {
    await message.channel.send('Your prefix includes not allowed characters.');
    return;
  }

  if (prefix.length >= 5) {
    await message.channel.send('Your code may not be longer then 5 characters.');
    return;
  }

  guild.prefix = prefix;
  await util.saveGuildConfig(guild);

  await message.channel.send(`Set prefix to \`${prefix}\`. Note: The default prefix(\`${config.prefix}\`) will still work.`);
};

module.exports = command;
