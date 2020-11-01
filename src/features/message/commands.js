const fs = require('fs').promises;
const { prefix } = require('../../../config.json');
const Discord = require('discord.js');
const util = require('../../util');

/**
 * loaded commands
 * @type {*[]}
 */
const commands = [];

(async () => {
    for (let file of await fs.readdir(`${__dirname}/../../commands`)) {
        let path = `${__dirname}/../../commands/${file}`;
        if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
            continue;
        }
        try {
            commands.push(require(path));
        } catch (e) {
            console.error(`Failed to load command '${file}'`, e);
        }
    }
})()

/**
 *
 * @param {Object} options
 * @param {Database} options.database
 * @param {module:"discord.js".Client} options.bot
 * @param {module:"discord.js".Message} message
 * @return {Promise<void>}
 */
exports.event = async(options, message) => {
    let foundCommand = await exports.getCommand(message);
    if (foundCommand === null) return;
    const [command,args] = foundCommand;

    try {
        await Promise.resolve(command.execute(message, args, options.database, options.bot));
    } catch (e) {
        let embed = new Discord.MessageEmbed({
            color: util.color.red,
            description: `An error occurred while executing that command!`
        });
        await message.channel.send(embed);
        console.error(`An error occurred while executing command ${command.names[0]}:`,e);
    }
}

/**
 * get the command in this message
 * @param {module:"discord.js".Message} message
 * @return {Promise<[Object,String[]]|null>}
 */
exports.getCommand = async (message) => {
    if (!message.guild || message.author.bot) return null;
    let guild = await util.getGuildConfig(message);
    const args = util.split(message.content,' ');
    let usedPrefix = util.startsWithMultiple(message.content.toLowerCase(),guild.prefix.toLowerCase(), prefix.toLowerCase());
    if (!usedPrefix) return null;

    let cmd = args.shift().slice(usedPrefix.length).toLowerCase();
    for (let command of commands) {
        if (command.names.includes(cmd)) {
            return [command,args];
        }
    }
    return null;
}
