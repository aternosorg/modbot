const Bot = require("./src/Bot");
const Monitor = require("./src/Monitor");

Bot.getInstance().start().catch(async (error) => {
    try {
        await Monitor.getInstance().emergency('Bot crashed', error);
    }
    catch (e) {
        console.error('Failed to send fatal error to monitoring');
    }
    console.error(error);
    process.exit(1)
});
