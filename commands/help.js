const util = require('../lib/util.js');
const Discord = require('discord.js');
const config = require('../config');
const fs = require('fs').promises;

const command = {};

command.description = 'List all commands or a description to a single command';

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
  const embed = new Discord.MessageEmbed()
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
        let cmd = commands[args[0]];
        embed
        .setAuthor(`Help for ${args[0]} | Prefix: ${config.prefix}`)
        .addFields(
          { name: "Usage", value: `${config.prefix}${args[0]} ${cmd.usage}`, inline: true},
          { name: "Description", value: cmd.description, inline: true}
        );
        if (cmd.comment) {
          embed.addFields(
            { name: "Comment", value: `${cmd.comment}`, inline: false});
        }
        if (cmd.names.length > 1) {
          let aliases = '';
          for (let name of cmd.names) {
            if (name !== args[0]) {
              aliases += `\`${name}\`, `;
            }
          }
          embed.addFields(
            { name: "Aliases", value: aliases.substring(0,aliases.length - 2), inline: false});
        }
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

module.exports = command;
