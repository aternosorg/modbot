/**
 * list auto responses
 * @param {Object} responses
 * @param {Discord.Message} message
 * @returns {Promise<void>}
 */
module.exports = async (responses, message) => {
    if (!responses.length) {
        return await message.channel.send("No auto-responses!");
    }

    let text = '';
    for (const [key, response] of responses.entries()) {
        text += `[${key}] (${response.trigger.type}): \`${response.trigger.content.replaceAll('`','\`')}\` \n`;
    }
    await message.channel.send(text.substring(0, 2000));
};