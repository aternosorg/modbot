/**
 * list auto responses
 * @param {Object} responses
 * @param {Discord.Message} message
 * @returns {Promise<void>}
 */
module.exports = async (responses, message) => {
    if (!responses.size) {
        return await message.channel.send("No auto-responses!");
    }

    let text = '';
    for (const [id, response] of responses) {
        if(text.length > 1800){
            await message.channel.send(text);
            text = '';
        }
        text += `[${id}] (${response.trigger.type}): \`${response.trigger.content}\` \n`;
    }
    await message.channel.send(text.substring(0, 2000));
};
