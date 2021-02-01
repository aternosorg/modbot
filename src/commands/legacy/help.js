const util = require('../../util.js');
const Discord = require('discord.js');
const fs = require('fs').promises;
const GuildConfig = require('../../GuildConfig');
const CommandHandler = require('../../features/message/commands');

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

const newCommands = CommandHandler.getCommands();
for (const cmd in newCommands) {
  commandList += `\`${cmd}\`, `
}

command.execute = async (message, args, database, bot) => {
  let config = await GuildConfig.get(message.guild.id);
  let embed = new Discord.MessageEmbed()
  .setColor(util.color.green)
  .setFooter(`Command executed by ${message.author.username}`)
  .setTimestamp();
  if (!args.length || args[0] === 'list') {
    embed
    .setAuthor(`Help Menu | Prefix: ${config.prefix}`)
    .addFields(
        /** @type {any} */ { name: "Commands", value: commandList, inline: true}
    );
  }
  else {
    const name = args[0];
    if (newCommands[name]) {
      embed = await newCommands[name].getUsage(message, name, config);
    }
    else if (commands[name]) {
      embed = await command.getUse(message, name);
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
  let config = await GuildConfig.get(message.guild.id);
  let embed = new Discord.MessageEmbed()
    .setAuthor(`Help for ${cmd} | Prefix: ${config.prefix}`)
    .setFooter(`Command executed by ${message.author.username}`)
    .addFields(
        /** @type {any} */ { name: "Usage", value: `\`${config.prefix}${cmd} ${command.usage}\``, inline: true},
        /** @type {any} */ { name: "Description", value: command.description, inline: true}
    )
    .setColor(util.color.green)
    .setTimestamp();
    if (command.comment) {
      embed.addFields(
          /** @type {any} */{ name: "Comment", value: `${command.comment}`, inline: false});
    }
    if (command.names.length > 1) {
      let aliases = '';
      for (let name of command.names) {
        if (name !== cmd) {
          aliases += `\`${name}\`, `;
        }
      }
      embed.addFields(
          /** @type {any} */{ name: "Aliases", value: aliases.substring(0,aliases.length - 2), inline: false});
    }
  return embed;
};

module.exports = command;
