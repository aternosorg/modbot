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

      await message.channel.send(`Disabled log!`);
      break;
    default:
      if (!['ban','kick','mute','softban'].includes(action)) {
        message.channel.send("Possible actions: ban, kick, mute, softban");
        return;
      }

      let options = args.join(' ');
      let config = await util.getGuildConfig(message);
      config.punishments[strikes] = {
        action: action,
        options: options
      }
      await util.saveGuildConfig(config);
      await message.channel.send(`Set log channel to <#${channelId}>!`);
  }
}

exports.names = ['punish','punishment','punishments'];
