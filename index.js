const Bot = require("./src/Bot");

Bot.getInstance().start().catch((error) => {
    console.error(error);
    process.exit(1)
});