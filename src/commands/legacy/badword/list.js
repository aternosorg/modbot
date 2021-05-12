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
    for (const [id, badWord] of badWords) {
        if(text.length > 1500){
            await message.channel.send(text.substring(0, 2000));
            text = '';
        }
        text += `[${id}] ${badWord.global ? "global" : badWord.channels.map(c => `<#${c}>`).join(', ')} (${badWord.trigger.type}): \`${badWord.trigger.type === 'regex' ? '/' + badWord.trigger.content + '/' + badWord.trigger.flags : badWord.trigger.content}\` \n`;
    }
    await message.channel.send(text.substring(0, 2000));
};
