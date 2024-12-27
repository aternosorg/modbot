import logger from './bot/Logger.js';
import {ShardingManager} from 'discord.js';
import config from './bot/Config.js';
import database from './bot/Database.js';
import commandManager from './commands/CommandManager.js';

try {
    await logger.debug('Loading settings');
    await config.load();
    await logger.info('Connecting to database');
    await database.connect();
    await logger.info('Creating database tables');
    await database.createTables();
    await database.runMigrations();
    await logger.notice('Registering slash commands');
    await commandManager.registerGlobalCommands();

    await logger.info('Spawning shards');
    const manager = new ShardingManager(
        import.meta.dirname + '/shard.js',
        {
            token: config.data.authToken,
        }
    );

    manager.on('shardCreate', async shard => {
        shard.args = [shard.id, manager.totalShards];
        await logger.notice(`Launched shard ${shard.id}`);


        shard.on('ready', () => {
            logger.info(`Shard ${shard.id} connected to Discord's Gateway.`);
        });
    });
    await manager.spawn();
} catch (error) {
    try {
        await logger.critical('Shard Manager crashed', error);
    } catch (e) {
        console.error('Failed to send fatal error to monitoring', e);
    }
    process.exit(1);
}
