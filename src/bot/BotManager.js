import Bot from './Bot.js';
import Database from '../Database.js';
import Logger from '../logging/Logger.js';
import Config from '../Config.js';

export default class BotManager {
    static #instance = new BotManager();

    static get instance() {
        return this.#instance;
    }

    async start() {
        await Logger.instance.debug('Loading config');
        await Config.instance.load();
        await Logger.instance.debug('Connecting to database');
        await Database.instance.connect(Config.instance.data.database);
        await Logger.instance.debug('Creating database tables');
        await Database.instance.createTables();
        await Logger.instance.notice('Logging into discord');
        await Bot.instance.start();
        await Logger.instance.info('Done!');
    }

}