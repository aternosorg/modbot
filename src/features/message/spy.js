const icons = require('../../icons')

exports.event = async (options, message) => {
    if (message.mentions.has(options.bot.user) || message.content.includes(options.bot.username)) {
        await message.react(icons.eyes)
    }
};
