const util = require('../../../util.js');

/**
 * get info about a bad word
 * @param {module:"discord.js".Collection}  badWords
 * @param {module:"discord.js".Message}     message
 * @param {String[]}                        args
 * @returns {Promise<void>}
 */
module.exports = async (badWords, message, args) => {
    if (!args.length) {
        await message.channel.send("Provide the id of the bad word you want to view");
        return;
    }
    let badWord = badWords.get(parseInt(args.shift()));
    if (!badWord) {
        await message.channel.send("Invalid id!");
        return;
    }

    await message.channel.send(badWord.embed("Bad word",util.color.green));
};
