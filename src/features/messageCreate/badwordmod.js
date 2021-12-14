const BadWord = require('../../BadWord');
const util = require('../../util');
const Log = require('../../Log');
const Member = require('../../Member');
const {Message} = require('discord.js');
const Request = require('../../Request');

exports.event = async (options, /** @type {Message} */message) => {
    if (!message.guild || await util.ignoresAutomod(message)) return;

    const words = (await BadWord.get(message.channel.id, message.guild.id)).sort((a,b) => b.priority - a.priority);
    for (let [,word] of words) {
        if (word.matches(message)) {
            await matchFound(message, word, options);
            return;
        }
    }

    let urls = message.content.match(/(https?:\/\/\w+\.[\w|/]+)/ig) ?? [];
    urls = urls.map(async url => {
        const request = new Request(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            timeout: 3000
        });

        try {
            const data = await request.getResponseHeaders();
            return data.redirectUrls.pop();
        }
        catch {
            return null;
        }
    });
    urls = await Promise.all(urls);

    for (const word of words.values()) {
        if (urls.some(url => word.matchesString(url))) {
            await matchFound(message, word, options);
            return;
        }
    }
};

async function matchFound(message, word, options) {
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
}
