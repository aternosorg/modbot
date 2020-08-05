const util = require('../lib/util.js');

exports.command = async (message, args, database, bot) => {
  if (!message.member.hasPermission('MANAGE_GUILD')) {
      message.channel.send('You need the "Manage Server" permission to use this command.');
      return;
  }

  let config = await util.getGuildConfig(message);
  if (!config.punishments) {
    config.punishments = {};
  }

  let count = parseInt(args.shift());
  if (!count) {
    let list = '';
    for (let key in config.punishments) {
      let value = config.punishments[key]
      if (!value) {
        continue;
      }
      if (value.duration) {
        list += `${key}: ${value.action} for ${util.secToTime(value.duration)} \n`
      }
      else {
        list += `${key}: ${value.action} \n`
      }
    }
    if (list === '') {
      list = 'No punishments set up';
    }

    util.sendEmbed(message.channel, {
      title: 'Punishments',
      description: list
    })
    return;
  }
  if (count <= 0) {
    message.channel.send("You can't have negative strikes'");
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
      await util.saveGuildConfig(config);
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
        await message.channel.send(`Set punishment for ${count} ${count === 1 ? "strike" : "strikes"} to ${action} for ${util.secToTime(duration)}!`);
      }
      else {
        await message.channel.send(`Set punishment for ${count} ${count === 1 ? "strike" : "strikes"} to ${action}!`);
      }
  }
}

exports.names = ['punish','punishment','punishments'];
