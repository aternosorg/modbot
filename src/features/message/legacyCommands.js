const fs = require('fs').promises;
const { prefix } = require('../../../config.json');
const Discord = require('discord.js');
const util = require('../../util');
const GuildConfig = require('../../GuildConfig');
const monitor = require('../../Monitor').getInstance();
const {APIErrors} = Discord.Constants;

/**
 * loaded commands
 * @type {*[]}
 */
const commands = [];

(async () => {
    for (let file of await fs.readdir(`${__dirname}/../../commands/legacy`)) {
        let path = `${__dirname}/../../commands/legacy/${file}`;
        if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
            continue;
        }
        try {
            commands.push(require(path));
        } catch (e) {
            await monitor.error(`Failed to load legacy command 'legacy/${file}'`, e);
            console.error(`Failed to load legacy command 'legacy/${file}'`, e);
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
        try {
            if  (e.code === APIErrors.MISSING_PERMISSIONS) {
                await message.channel.send('I am missing permissions to execute that command!');
            }
            else {
                await message.channel.send('An error occurred while executing that command!');
            }
        }
        catch (e2) {
            if (e2.code === APIErrors.MISSING_PERMISSIONS) {
                return;
            }
        }
        await monitor.error(`Failed to execute command ${command.names[0]}`, e);
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
    let guild = await GuildConfig.get(/** @type {module:"discord.js".Snowflake} */ message.guild.id);
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
