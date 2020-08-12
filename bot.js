const Discord = require('discord.js');
const Database = require('./lib/Database');
const util = require('./lib/util');

const fs = require('fs').promises;

const config = require('./config');

const bot = new Discord.Client({
  disableMentions: 'everyone',
  presence: { status: "dnd", activity: { type: "WATCHING", name: "you" } }
});

//connect to mysql db
const database = new Database(config.db);

(async () => {
    await database.waitForConnection();
    console.log("Connected!");

    await database.query("CREATE TABLE IF NOT EXISTS `channels` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))");
    await database.query("CREATE TABLE IF NOT EXISTS `guilds` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))");
    await database.query("CREATE TABLE IF NOT EXISTS `servers` (`channelid` VARCHAR(20) NOT NULL, `ip` VARCHAR(20) NOT NULL, `timestamp` int NOT NULL, PRIMARY KEY (`ip`,`channelid`))");
    await database.query("CREATE TABLE IF NOT EXISTS `moderations` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `userid` VARCHAR(20) NOT NULL, `action` VARCHAR(10) NOT NULL,`created` int NOT NULL, `value` int DEFAULT 0,`expireTime` int NULL DEFAULT NULL, `reason` TEXT,`moderator` VARCHAR(20) NULL DEFAULT NULL, `active` BOOLEAN DEFAULT TRUE)");

    util.init(database, bot);

    await bot.login(config.auth_token);

    // load commands
    const commands = [];
    for (let file of await fs.readdir(`${__dirname}/commands`)) {
        let path = `${__dirname}/commands/${file}`;
        if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
            continue;
        }
        try {
            commands.push(require(path));
        } catch (e) {
            console.error(`Failed to load command '${file}'`, e);
        }
    }

    // FEATURES
    // message
    const messages = [];
    for (let file of await fs.readdir(`${__dirname}/features/message`)) {
        let path = `${__dirname}/features/message/${file}`;
        if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
            continue;
        }
        try {
            let feature = require(path);
            messages.push(feature);
        } catch (e) {
            console.error(`Failed to load message feature '${file}'`, e);
        }
    }
    // guildMemberAdd
    const guildMemberAdds = [];
    for (let file of await fs.readdir(`${__dirname}/features/guildMemberAdd`)) {
        let path = `${__dirname}/features/guildMemberAdd/${file}`;
        if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
            continue;
        }
        try {
            let feature = require(path);
            guildMemberAdds.push(feature);
        } catch (e) {
            console.error(`Failed to load guildMemberAdd feature '${file}'`, e);
        }
    }

    const guildBanRemoves = [];
    for (let file of await fs.readdir(`${__dirname}/features/guildBanRemove`)) {
        let path = `${__dirname}/features/guildBanRemove/${file}`;
        if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
            continue;
        }
        try {
            let feature = require(path);
            guildBanRemoves.push(feature);
        } catch (e) {
            console.error(`Failed to load guildBanRemove feature '${file}'`, e);
        }
    }

    // load checks
    for (let file of await fs.readdir(`${__dirname}/checks`)) {
        let path = `${__dirname}/checks/${file}`;
        if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
            continue;
        }
        try {
            let check = require(path);
            check.check(database, bot);
            setInterval(check.check, check.interval * 1000, database, bot);
        } catch (e) {
            console.error(`Failed to load feature '${file}'`, e);
        }
    }

    // commands
    bot.on('message', async (message) => {
        if (!message.guild || message.author.bot) return;
        let guild = await util.getGuildConfig(message);
        const args = util.split(message.content,' ');
        let cmd;
        if (!message.content.toLowerCase().startsWith(guild.prefix.toLowerCase())) {
          if (!message.content.toLowerCase().startsWith(config.prefix.toLowerCase())) {
            return;
          }
          else {
            cmd = args.shift().slice(config.prefix.length).toLowerCase();
          }
        }
        else {
          cmd = args.shift().slice(guild.prefix.length).toLowerCase();
        }


        for (let command of commands) {
            if (command.names.includes(cmd)) {
                try {
                  await Promise.resolve(command.execute(message, args, database, bot));
                } catch (e) {
                  let embed = new Discord.MessageEmbed({
                    color: util.color.red,
                    description: `An error occured while executing that command!`
                  });
                  await message.channel.send(embed);
                  console.error(`An error occured while executing command ${command.names[0]}:`,e);
                }
                break;
            }
        }
    });

    //FEATURES
    // message
    bot.on('message', async (message) => {
        for (let feature of messages) {
            await Promise.resolve(feature.message(message, database));
        }
    });
    // guildMemberAdd features
    bot.on('guildMemberAdd', async (member) => {
        for (let feature of guildMemberAdds) {
            await Promise.resolve(feature.message(member, database));
        }
    });
    //guildBanRemove
    bot.on('guildBanRemove', async (guild, user) => {
        for (let feature of guildBanRemoves) {
            await Promise.resolve(feature.message(guild, user, database));
        }
    });

    // errors
    bot.on('error', async (error) => {
      console.error('An error occured',error);
    });
})();
