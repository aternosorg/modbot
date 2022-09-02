import Logger from './src/logging/Logger.js';
import BotManager from './src/bot/BotManager.js';

BotManager.instance.start().catch(async (error) => {
    try {
        await Logger.instance.error({
            message: 'Bot crashed',
            error: Logger.instance.getData(error),
        });
    }
    catch (e) {
        console.error('Failed to send fatal error to monitoring');
    }
    console.error(error);
    process.exit(1);
});
