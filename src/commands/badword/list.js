/**
 * list bad words
 * @param {module:"discord.js".Collection}  badWords
 * @param {module:"discord.js".Message}     message
 * @returns {Promise<void>}
 */
module.exports = async (badWords, message) => {
    if (!badWords.size) {
        return await message.channel.send("No bad words!");
    }

    let text = '';
    for (const [id, response] of badWords) {
        if(text.length > 1500){
            await message.channel.send(text);
            text = '';
        }
        text += `[${id}] ${response.global ? "global" : response.channels.map(c => `<#${c}>`).join(', ')} (${response.trigger.type}): \`${response.trigger.type === 'regex' ? '/' + response.trigger.content + '/' + response.trigger.flags : response.trigger.content}\` \n`;
    }
    await message.channel.send(text.substring(0, 2000));
};
