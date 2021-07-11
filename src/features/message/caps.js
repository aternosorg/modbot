const util = require('../../util');
const Log = require('../../Log');
const GuildConfig = require('../../config/GuildConfig');

exports.event = async (options, message) => {
    if (!message.guild || await util.ignoresAutomod(message) || (await GuildConfig.get(message.guild.id)).caps === false) return;

    let uppercase = message.content.match(/[A-Z]+/g);
    if (uppercase) uppercase = uppercase.join().length;
    let lowercase = message.content.match(/[a-z]+/g);
    if (lowercase) lowercase = lowercase.join().length;

    if (uppercase > 5 && uppercase / (lowercase + uppercase) >= 0.7) {
        const reason = 'Too many caps';
        const response = await message.channel.send(`<@!${message.author.id}> Don't use that many capital letters!`);
        await util.delete(message, { reason: reason } );
        await Log.logMessageDeletion(message, reason);
        await response.delete({timeout: 3000});
    }
};
