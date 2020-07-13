const Discord = require('discord.js');
const Database = require('./lib/Database');

const fs = require('fs').promises;

const config = require('./config');
const channelConfig = require('./util/channelConfig.js');

const bot = new Discord.Client();

let channels = new Discord.Collection();
let guilds = new Discord.Collection();

//connect to mysql db
const database = new Database(config.db);

(async () => {
    await database.waitForConnection();
    console.log("Connected!");

    await database.query("CREATE TABLE IF NOT EXISTS `channels` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))");
    await database.query("CREATE TABLE IF NOT EXISTS `guilds` (`id` VARCHAR(20) NOT NULL, `config` TEXT NOT NULL, PRIMARY KEY (`id`))");
    await database.query("CREATE TABLE IF NOT EXISTS `servers` (`channelid` VARCHAR(20) NOT NULL, `ip` varchar(20) NOT NULL, `timestamp` int NOT NULL, PRIMARY KEY (`ip`,`channelid`))");

    let result = await database.queryAll("SELECT * FROM channels");
    for (let row of result) {
        channels.set(row.id, JSON.parse(row.config));
    }

    result = await database.queryAll("SELECT * FROM guilds");
    for (let row of result) {
        guilds.set(row.id, JSON.parse(row.config));
    }

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

    // load features
    const features = [];
    for (let file of await fs.readdir(`${__dirname}/features`)) {
        let path = `${__dirname}/features/${file}`;
        if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
            continue;
        }
        try {
            let feature = require(path);
            await feature.init(database, channels, bot);
            features.push(feature);
        } catch (e) {
            console.error(`Failed to load feature '${file}'`, e);
        }
    }

    bot.on('message', async (message) => {
        if (!message.guild || message.author.bot) return;
        if (!message.content.toLowerCase().startsWith(config.prefix.toLowerCase())) return;

        const args = message.content.split(/\s+/g);
        const cmd = args.shift().slice(config.prefix.length).toLowerCase();

        for (let command of commands) {
            if (command.names.includes(cmd)) {
                await Promise.resolve(command.command(message, args, guilds, channels, database));
                break;
            }
        }
    });
    bot.on('message', async (message) => {
        for (let feature of features) {
            await Promise.resolve(feature.message(message, guilds, channels, database));
        }
    });
    bot.on('error', async (error) => {
      console.error('An error occured',error);
    });
})();
