import Bot from './Bot.js';
import Database from './Database.js';
import Logger from '../Logger.js';
import Config from './Config.js';
import IntervalManager from '../interval/IntervalManager.js';
import DiscordEventManager from '../events/discord/DiscordEventManager.js';
import RestEventManagerEventManager from '../events/rest/RestEventManager.js';
import CommandManager from '../commands/CommandManager.js';

export default class BotManager {
    static #instance = new BotManager();

    static get instance() {
        return this.#instance;
    }

    async start() {
        await Logger.instance.debug('Loading config');
        await Config.instance.load();
        await Logger.instance.info('Connecting to database');
        await Database.instance.connect(Config.instance.data.database);
        await Logger.instance.info('Creating database tables');
        await Database.instance.createTables();
        await Logger.instance.notice('Logging into discord');
        await Bot.instance.start();
        await Logger.instance.info('Online');

        await Logger.instance.debug('Loading event listeners');
        new DiscordEventManager().subscribe();
        new RestEventManagerEventManager().subscribe();
        await Logger.instance.notice('Registering slash commands');
        await CommandManager.instance.register();
        await Logger.instance.debug('Loading intervals');
        new IntervalManager().schedule();
        await Logger.instance.info('Started');
    }

}