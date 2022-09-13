import Logger from './src/Logger.js';
import BotManager from './src/bot/BotManager.js';

BotManager.instance.start().catch(async (error) => {
    try {
        await Logger.instance.critical('Bot crashed', error);
    }
    catch (e) {
        console.error('Failed to send fatal error to monitoring');
    }
    console.error(error);
    process.exit(1);
});
