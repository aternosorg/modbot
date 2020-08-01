const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if (!message.member.hasPermission('MANAGE_GUILD')) {
      message.channel.send('You need the "Manage Server" Permission to use this command.');
      return;
  }

  let count = parseInt(args.shift());
  let action = args.shift();
  if (!count || !action) {
    message.channel.send("USAGE: 'punish strikeCount action options' OR 'punish strikeCount disabled'");
    return;
  }
  switch (action) {
    case 'off':
    case 'disabled':
      await message.channel.send(`Disabled punishment at ${count}!`);
      break;
    default:
      if (!['ban','kick','mute','softban'].includes(action)) {
        message.channel.send("Possible actions: ban, kick, mute, softban");
        return;
      }

      let duration = util.timeToSec(args.join(' '));
      let config = await util.getGuildConfig(message);
      if (!config.punishments) {
        config.punishments = [];
      }
      config.punishments[count] = {
        action: action,
        duration: duration
      }
      await util.saveGuildConfig(config);
      await message.channel.send(`Set punishment for ${count} strikes to ${action}!`);
  }
}

exports.names = ['punish','punishment','punishments'];
