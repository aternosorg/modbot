import logger from './bot/Logger.js';
import config from './bot/Config.js';
import database from './bot/Database.js';
import bot from './bot/Bot.js';
import DiscordEventManager from './events/discord/DiscordEventManager.js';
import RestEventManagerEventManager from './events/rest/RestEventManager.js';
import commandManager from './commands/CommandManager.js';
import IntervalManager from './interval/IntervalManager.js';

try {
    await logger.debug('Loading settings');
    await config.load();
    await logger.info('Connecting to database');
    await database.connect();
    await logger.notice('Logging into discord');
    await bot.start();
    await logger.info('Online');

    await logger.debug('Loading event listeners');
    new DiscordEventManager().subscribe();
    new RestEventManagerEventManager().subscribe();
    await logger.debug('Loading intervals');
    new IntervalManager().schedule();
    await logger.notice('Updating guild commands');
    await commandManager.updateCommandIds();
    await commandManager.updateGuildCommands();
    await logger.info('Started');
} catch (error) {
    try {
        await logger.critical('Shard crashed', error);
    } catch (e) {
        console.error('Failed to send fatal error to monitoring', e);
    }
    process.exit(1);
}
