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
    await database.query("CREATE TABLE IF NOT EXISTS `responses` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `trigger` TEXT NOT NULL, `response` TEXT NOT NULL, `global` BOOLEAN NOT NULL, `channels` TEXT NULL DEFAULT NULL)");
    await database.query("CREATE TABLE IF NOT EXISTS `moderations` (`id` int PRIMARY KEY AUTO_INCREMENT, `guildid` VARCHAR(20) NOT NULL, `userid` VARCHAR(20) NOT NULL, `action` VARCHAR(10) NOT NULL,`created` bigint NOT NULL, `value` int DEFAULT 0,`expireTime` bigint NULL DEFAULT NULL, `reason` TEXT,`moderator` VARCHAR(20) NULL DEFAULT NULL, `active` BOOLEAN DEFAULT TRUE)");

    util.init(database, bot);

    await bot.login(config.auth_token);

    // FEATURES
    for (let folder of await fs.readdir(`${__dirname}/features`)) {
        let folderPath = `${__dirname}/features/${folder}`;
        if (!(await fs.lstat(folderPath)).isDirectory()) {
            continue;
        }
        let feature = [];
        for (let file of await fs.readdir(folderPath)) {
          let path = `${__dirname}/features/${folder}/${file}`;
          if (!file.endsWith('.js') || !(await fs.lstat(path)).isFile()) {
              continue;
          }
          try {
              feature.push(require(path));
          } catch (e) {
              console.error(`Failed to load message feature '${file}'`, e);
          }
        }
        bot.on(folder, async (...args) => {
          for (let f of feature) {
              await Promise.resolve(f.event({database,bot}, ...args));
          }
        });
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

    // errors
    bot.on('error', async (error) => {
      console.error('An error occurred',error);
    });
})();
