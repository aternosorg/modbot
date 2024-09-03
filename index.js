import logger from './src/bot/Logger.js';
import config from './src/bot/Config.js';
import database from './src/bot/Database.js';
import bot from './src/bot/Bot.js';
import DiscordEventManager from './src/events/discord/DiscordEventManager.js';
import RestEventManagerEventManager from './src/events/rest/RestEventManager.js';
import commandManager from './src/commands/CommandManager.js';
import IntervalManager from './src/interval/IntervalManager.js';

/**
 *
 */
async function start() {
    await logger.debug('Loading settings');
    await config.load();
    await logger.info('Connecting to database');
    await database.connect();
    await logger.info('Creating database tables');
    await database.createTables();
    await database.runMigrations();
    await logger.notice('Logging into discord');
    await bot.start();
    await logger.info('Online');

    await logger.debug('Loading event listeners');
    new DiscordEventManager().subscribe();
    new RestEventManagerEventManager().subscribe();
    await logger.debug('Loading intervals');
    new IntervalManager().schedule();
    await logger.notice('Registering slash commands');
    await commandManager.register();
    await logger.info('Started');
}

start().catch(async (error) => {
    try {
        await logger.critical('Bot crashed', error);
    }
    catch (e) {
        console.error('Failed to send fatal error to monitoring', e);
    }
    console.error(error);
    process.exit(1);
});
