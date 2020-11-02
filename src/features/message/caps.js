const util = require('../../util');

exports.event = async (options, message) => {
    if (!message.guild || message.author.bot || await util.isMod(message.member) || message.member.hasPermission("MANAGE_MESSAGES")) return;

    const uppercase = message.content.match(/[A-Z]+/g).join().length;
    const lowercase = message.content.match(/[a-z]+/g).join().length;

    if (uppercase / lowercase >= 0.70) {
        const reason = `Too much caps`;
        await util.delete(message, { reason: reason } );
        await util.logMessageDeletion(message, reason);
    }
};