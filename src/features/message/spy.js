const icons = require('../../icons')

exports.event = async (options, message) => {
    if (message.mentions.has(options.bot.user) || message.content.toLowerCase().includes(options.bot.user.username.toLowerCase())) {
        await message.react(icons.eyes);
    }
};
