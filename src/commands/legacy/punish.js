const util = require('../../util.js');
const GuildConfig = require('../../GuildConfig');
const Discord = require('discord.js');

const command = {};

command.description = 'Specify auto punishments';

command.usage = 'count action <duration>';

command.comment = 'If there is no punishment for the current strike count the last punishment will be repeated';

command.names = ['punish','punishment','punishments'];

command.execute = async (message, args, database, bot) => {
  /** @type {GuildConfig} */
  const guildconfig = await GuildConfig.get(message.guild.id);
  if (!guildconfig.isMod(message.member) && !message.member.hasPermission('MANAGE_GUILD')) {
    message.channel.send("You don't have the permission to execute this command.");
    return;
  }

  /** @type {GuildConfig} */
  const config = await GuildConfig.get(message.guild.id);

  let count = parseInt(args.shift());
  if (!count) {
    let list = '';
    const punishments = config.getPunishments();
    for (const [key,value] of punishments) {
      if (value.duration) {
        list += `${key}: ${value.action} for ${util.secToTime(value.duration)} \n`;
      }
      else {
        list += `${key}: ${value.action} \n`;
      }
    }
    if (list === '') {
      list = 'No punishments set up';
    }

    await message.channel.send(new Discord.MessageEmbed({
      title: 'Punishments',
      description: list
    }));
    return;
  }
  if (!message.member.hasPermission('MANAGE_GUILD')) {
    message.channel.send('You need the "Manage Server" permission to use this command.');
    return;
  }
  if (count <= 0) {
    message.channel.send("You can't have negative strikes!");
    return;
  }

  /** @type {String} */
  const action = args.shift();
  if (!action) {
    message.channel.send(await util.usage(message,command.names[0]));
    return;
  }
  switch (action) {
    case 'off':
    case 'disabled':
      await config.setPunishment(count, null);
      await message.channel.send(`Disabled punishment at ${count}!`);
      break;
    default:
      if (!['ban','kick','mute','softban'].includes(action)) {
        message.channel.send("Possible actions: ban, kick, mute, softban");
        return;
      }

      let duration = util.timeToSec(args.join(' '));
      await config.setPunishment(count, {
        action: action,
        duration: duration
      });
      if (duration) {
        await message.channel.send(`Set punishment for ${count} ${count === 1 ? "strike" : "strikes"} to ${action} for ${util.secToTime(duration)}!`);
      }
      else {
        await message.channel.send(`Set punishment for ${count} ${count === 1 ? "strike" : "strikes"} to ${action}!`);
      }
  }
};

module.exports = command;
