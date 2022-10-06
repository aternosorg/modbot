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

exports.event = async (options, message) => {
    if(message.createdAt.getMonth() === 9 &&
        !message.author.bot &&
        message.content.toLowerCase().includes('spookbot') ||
        message.content.toLowerCase().includes('boo')) {
        try {
            await message.react(icons.ghost);
        } catch(e) {
            if(e.code !== APIErrors.UNKNOWN_MESSAGE) {
                throw e;
            }
        }
    }
};