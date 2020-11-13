const util = require('../util.js');
const GuildConfig = require('../GuildConfig');

const command = {};

command.description = 'Set a cooldown on links';

command.usage = 'duration|off';

command.names = ['linkcooldown'];

command.execute = async (message, args, database, bot) => {
  //Permission check
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    message.channel.send('You need the "Manage Server" permission to use this command.');
    return;
  }

  //Get channel
  let duration = util.timeToSec(args.join(' '));
  if (!duration && (args[0] !== 'off' || args[0] !== 'disabled')) {
    await message.channel.send("USAGE: duration|off!");
    return;
  }

  let config = await GuildConfig.get(message.guild.id);
  if (duration) {
    config.linkCooldown = duration;
  }
  else {
    delete config.linkCooldown;
  }
  await config.save();

  if (duration) {
    await message.channel.send(`Set link cooldown to ${util.secToTime(duration)}!`);
  }
  else {
    await message.channel.send('Disabled link cooldown');
  }
};

module.exports = command;
