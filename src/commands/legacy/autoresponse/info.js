const util = require('../../../util.js');

/**
 * get info about an autoresponse
 * @param {module:"discord.js".Collection}  responses
 * @param {module:"discord.js".Message}     message
 * @param {String[]}                        args
 * @returns {Promise<void>}
 */
module.exports = async (responses, message, args) => {
    if (!args.length) {
        await message.channel.send("Provide the id of the autoresponse you want to view");
        return;
    }
    let response = responses.get(parseInt(args.shift()));
    if (!response) {
        await message.channel.send("Invalid id!");
        return;
    }

    await message.channel.send(response.embed("Autoresponse",util.color.green));
};
