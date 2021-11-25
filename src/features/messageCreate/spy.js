const icons = require('../../icons');
const {APIErrors} = require('discord.js').Constants;

exports.event = async (options, message) => {
    if (!message.author.bot && message.content.includes(options.bot.user.id) || message.content.toLowerCase().includes(options.bot.user.username.toLowerCase())) {
        try {
            await message.react(icons.eyes);
        }
        catch (e) {
            if (e.code !== APIErrors.UNKNOWN_MESSAGE) {
                throw e;
            }
        }
    }
};
