const util = require('../lib/util.js');
const Discord = require('discord.js');
const fs = require('fs').promises;

const command = {};

command.description = 'List all commands or get a description for a single command';

command.usage = '<command>';

command.names = ['help'];

const commands = {};
let commandList = '';

(async () => {
  for (let file of await fs.readdir(`${__dirname}`)) {
    let path = `${__dirname}/${file}`;
    if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
      continue;
    }
    try {
      let cmd = require(path);
      for (let name of cmd.names) {
        commands[name] = cmd;
      }
      commandList += `\`${cmd.names[0]}\`, `;
    } catch (e) {
      console.error(`Failed to load command '${file}'`, e);
    }
  }
  commandList = commandList.substring(0, commandList.length - 2);
})();

command.execute = async (message, args, database, bot) => {
  let config = await util.getGuildConfig(message);
  let embed = new Discord.MessageEmbed()
  .setColor(util.color.green)
  .setFooter(`Command executed by ${message.author.username}`)
  .setTimestamp();
  if (!args.length || args[0] === 'list') {
    embed
    .setAuthor(`Help Menu | Prefix: ${config.prefix}`)
    .addFields(
      { name: "Commands", value: commandList, inline: true}
    );
  }
  else {
    if (commands[args[0]]) {
      embed = await command.getUse(message, args[0]);
    }
    else {
      embed
      .setAuthor(`Help | Prefix: ${config.prefix}`)
      .setColor(util.color.red)
      .setDescription(`${args[0]} is not a valid command`);
    }
  }
  message.channel.send(embed);

};

command.getUse = async (message, cmd) => {
  let command = commands[cmd];
  let config = await util.getGuildConfig(message);
  let embed = new Discord.MessageEmbed()
    .setAuthor(`Help for ${cmd} | Prefix: ${config.prefix}`)
    .setFooter(`Command executed by ${message.author.username}`)
    .addFields(
      { name: "Usage", value: `\`${config.prefix}${cmd} ${command.usage}\``, inline: true},
      { name: "Description", value: command.description, inline: true}
    )
    .setColor(util.color.green)
    .setTimestamp();
    if (command.comment) {
      embed.addFields(
        { name: "Comment", value: `${command.comment}`, inline: false});
    }
    if (command.names.length > 1) {
      let aliases = '';
      for (let name of command.names) {
        if (name !== cmd) {
          aliases += `\`${name}\`, `;
        }
      }
      embed.addFields(
        { name: "Aliases", value: aliases.substring(0,aliases.length - 2), inline: false});
    }
  return embed;
};

module.exports = command;
