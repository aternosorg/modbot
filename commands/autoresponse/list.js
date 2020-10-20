/**
 * list auto responses
 * @param {Object} responses
 * @param {Discord.Message} message
 * @returns {Promise<void>}
 */
module.exports = async (responses, message) => {
    if (!responses.size) {
        return await message.channel.send("No autoresponses!");
    }

    let text = '';
    for (const [id, response] of responses) {
        if(text.length > 1500){
            await message.channel.send(text);
            text = '';
        }
        text += `[${id}] ${response.global ? "global" : response.channels.map(c => `<#${c}>`).join(', ')} (${response.trigger.type}): \`${response.trigger.content}\` \n`;
    }
    await message.channel.send(text.substring(0, 2000));
};
