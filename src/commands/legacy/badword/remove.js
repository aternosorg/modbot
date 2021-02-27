const util = require('../../../util.js');
const icons = require('../../../icons');

/**
 * remove a bad word
 * @param {module:"discord.js".Collection}  badWords
 * @param {module:"discord.js".Message}     message
 * @param {String[]}                        args
 * @returns {Promise<void>}
 */
module.exports = async (badWords, message, args) => {
    if (!args.length) {
        await message.channel.send("Provide the id of the bad word you want to remove");
        return;
    }
    let badWord = badWords.get(parseInt(args.shift()));
    if (!badWord) {
        await message.channel.send("Invalid id!");
        return;
    }

    let confirmation = await message.channel.send("Do you really want to delete this bad word?", badWord.embed("Remove bad word", util.color.red));
    {
        let yes = confirmation.react(icons.yes);
        let no = confirmation.react(icons.no);
        await Promise.all([yes,no]);
    }

    let confirmed;
    try {
        confirmed = (await confirmation.awaitReactions((reaction, user) => {
            return user.id === message.author.id && (reaction.emoji.name === icons.yes || reaction.emoji.name === icons.no);
        }, { max: 1, time: 15000, errors: ['time'] })).first().emoji.name === icons.yes;
    }
    catch {
        return await message.channel.send("You took to long to react!");
    }
    if (!confirmed) {
        return await message.channel.send("Canceled!");
    }

    await badWord.remove();

    await message.channel.send(`Removed the bad word with the id ${badWord.id}!`);
};
