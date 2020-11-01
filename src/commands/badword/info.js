const util = require('../../util.js');

/**
 * get info about a bad word
 * @param {module:"discord.js".Collection}  badWords
 * @param {module:"discord.js".Message}     message
 * @param {String[]}                        args
 * @returns {Promise<void>}
 */
module.exports = async (badWords, message, args) => {
    if (!args.length) {
        await message.channel.send("Provide the id of the autoresponse you want to view");
        return;
    }
    let response = badWords.get(parseInt(args.shift()));
    if (!response) {
        await message.channel.send("Invalid id!");
        return;
    }

    await message.channel.send(response.embed("Bad word",util.color.green));
};
