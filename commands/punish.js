const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if (!message.member.hasPermission('MANAGE_GUILD')) {
      message.channel.send('You need the "Manage Server" Permission to use this command.');
      return;
  }

  let config = await util.getGuildConfig(message);
  if (!config.punishments) {
    config.punishments = [];
  }

  let count = parseInt(args.shift());
  if (!count) {
    let list = '';
    for (let [index, value] of config.punishments.entries()) {
      if (!value) {
        continue;
      }
      if (value.duration) {
        list += `${index}: ${value.action} for ${util.secToTime(value.duration)} \n`
      }
      else {
        list += `${index}: ${value.action} \n`
      }
    }

    util.sendEmbed(message.channel, {
      title: 'Punishments',
      description: list
    })
    return;
  }
  let action = args.shift();
  if (!action) {
    message.channel.send("USAGE: 'punish strikeCount action options' OR 'punish strikeCount disabled'");
    return;
  }
  switch (action) {
    case 'off':
    case 'disabled':
      delete config.punishments[count];
      await message.channel.send(`Disabled punishment at ${count}!`);
      break;
    default:
      if (!['ban','kick','mute','softban'].includes(action)) {
        message.channel.send("Possible actions: ban, kick, mute, softban");
        return;
      }

      let duration = util.timeToSec(args.join(' '));
      config.punishments[count] = {
        action: action,
        duration: duration
      }
      await util.saveGuildConfig(config);
      if (duration) {
        await message.channel.send(`Set punishment for ${count} strikes to ${action} for ${util.secToTime(duration)}!`);
      }
      else {
        await message.channel.send(`Set punishment for ${count} strikes to ${action}!`);
      }
  }
}

exports.names = ['punish','punishment','punishments'];
