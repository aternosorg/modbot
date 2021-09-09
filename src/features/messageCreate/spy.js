const icons = require('../../icons');

exports.event = async (options, message) => {
    if (!message.author.bot && message.content.includes(options.bot.user.id) || message.content.toLowerCase().includes(options.bot.user.username.toLowerCase())) {
        await message.react(icons.eyes);
    }
};
