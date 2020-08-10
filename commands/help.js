const util = require('../lib/util.js');
const Discord = require('discord.js');
const config = require('../config');
const fs = require('fs').promises;

const command = {};

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
          commandList += `${cmd.names[0]}, `;
      } catch (e) {
          console.error(`Failed to load command '${file}'`, e);
      }
  }
  commandList = commandList.substring(0, commandList.length - 2);
})();


command.command = async (message, args, database, bot) => {
  const embed = new Discord.MessageEmbed()
  .setColor(util.color.green)
  .setFooter(`Command executed by ${message.author.username}`)
  .setTimestamp();
      embed
      .setAuthor(`Help Menu | Prefix: ${config.prefix}`)
      .addFields(
        { name: "Commands", value: commandList, inline: true}
      );
  message.channel.send(embed);

};

command.names = ['help'];

module.exports = command;
