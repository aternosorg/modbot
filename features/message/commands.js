const fs = require('fs').promises;
const config = require('../../config');
const Discord = require('discord.js');
const util = require('../../lib/util');

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
 * @param {Discord.Client} options.bot
 * @param {Discord.Message} message
 * @return {Promise<void>}
 */
exports.event = async(options, message) => {
    if (!message.guild || message.author.bot) return;
    let guild = await util.getGuildConfig(message);
    const args = util.split(message.content,' ');
    let prefix = util.startsWithMultiple(message.content.toLowerCase(),guild.prefix.toLowerCase(), config.prefix.toLowerCase());
    if (!prefix) {
        return ;
    }
    let cmd = args.shift().slice(prefix.length).toLowerCase();

    for (let command of commands) {
        if (command.names.includes(cmd)) {
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
            break;
        }
    }
}