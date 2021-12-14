const BadWord = require('../../BadWord');
const util = require('../../util');
const Log = require('../../Log');
const Member = require('../../Member');
const {Message} = require('discord.js');
const got = require('got');

exports.event = async (options, /** @type {Message} */message) => {
    if (!message.guild || await util.ignoresAutomod(message)) return;

    const urls = await Promise.all(
        message.content.match(/(https?:\/\/\w+\.[\w|/]+)/ig)
            ?.map(async url => (await got.get(url)).url)
    );

    const words = (await BadWord.get(message.channel.id, message.guild.id)).sort((a,b) => b.priority - a.priority);
    for (let [,word] of words) {
        if (word.matches(message) || urls.some(s => word.matchesString(s))) {
            const reason = 'Using forbidden words or phrases';
            await util.delete(message);
            if (word.response !== 'disabled') {
                const response = await message.channel.send(`<@!${message.author.id}>` + (word.response === 'default' ? BadWord.defaultResponse : word.response));
                await util.delete(response, { timeout: 5000 });
            }
            await Log.logMessageDeletion(message, reason);
            if (word.punishment.action !== 'none') {
                await (new Member(message.author, message.guild))
                    .executePunishment(word.punishment, options.database, reason);
            }
            return;
        }
    }
};
